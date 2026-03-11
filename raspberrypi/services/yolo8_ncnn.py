import numpy as np
import cv2
import ncnn
import sys

PERSON_CLASS_ID = 0  # COCO identifies "person" as class 0

def sigmoid(x):
    x = np.clip(x, -50, 50)
    return 1.0 / (1.0 + np.exp(-x))

def letterbox_bgr(img_bgr, new_size=320):
    h, w = img_bgr.shape[:2]
    scale = min(new_size / w, new_size / h)
    new_w = int(round(w * scale))
    new_h = int(round(h * scale))

    resized = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    canvas = np.zeros((new_size, new_size, 3), dtype=np.uint8)

    pad_x = (new_size - new_w) // 2
    pad_y = (new_size - new_h) // 2
    canvas[pad_y:pad_y + new_h, pad_x:pad_x + new_w] = resized

    return canvas, scale, pad_x, pad_y

def iou_xyxy(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)
    iw = max(0, inter_x2 - inter_x1)
    ih = max(0, inter_y2 - inter_y1)
    inter = iw * ih
    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    return inter / (area_a + area_b - inter + 1e-9)

def nms(dets, iou_thr=0.5):
    dets = sorted(dets, key=lambda d: d["score"], reverse=True)
    keep = []
    while dets:
        best = dets.pop(0)
        keep.append(best)
        dets = [d for d in dets if iou_xyxy(best["box"], d["box"]) < iou_thr]
    return keep

class YOLOv8NCNN:
    def __init__(self, param_path, bin_path, input_size=640, conf=0.25, iou=0.5, num_threads=4, use_gpu=False):
        self.input_size = input_size
        self.conf = float(conf)
        self.iou = float(iou)

        self.net = ncnn.Net()
        self.net.opt.num_threads = int(num_threads)
        self.net.opt.use_vulkan_compute = bool(use_gpu)

        self.net.load_param(param_path)
        self.net.load_model(bin_path)

        self.in_blob = "in0"
        self.out_blob = "out0"

    def detect_people(self, img_bgr, debug=False):
        orig_h, orig_w = img_bgr.shape[:2]

        lb_bgr, scale, pad_x, pad_y = letterbox_bgr(img_bgr, self.input_size)
        lb_rgb = cv2.cvtColor(lb_bgr, cv2.COLOR_BGR2RGB)

        mat_in = ncnn.Mat.from_pixels(
            lb_rgb, ncnn.Mat.PixelType.PIXEL_RGB, self.input_size, self.input_size
        )
        mat_in.substract_mean_normalize([], [1/255.0, 1/255.0, 1/255.0])

        ex = self.net.create_extractor()
        ex.input(self.in_blob, mat_in)
        ret, out = ex.extract(self.out_blob)
        if ret != 0:
            raise RuntimeError(f"ncnn extract failed: {ret}")

        # --- decode NCNN Mat robustly ---
        w, h, c = out.w, out.h, out.c
        flat = np.array(out, dtype=np.float32).reshape(-1)

        expected = w * h * c
        if flat.size != expected:
            raise ValueError(f"Mat size mismatch: flat={flat.size} vs w*h*c={expected} (w={w},h={h},c={c})")

        # Common cases for YOLOv8 export:
        # 1) c==1 and (h,w) is either (8400,84) or (84,8400)
        # 2) sometimes c==84 with h*w == 8400 (rare, but handle it)

        if c == 1:
            mat2d = flat.reshape(h, w)
            if w == 84:
                pred = mat2d              # [N, 84]
            elif h == 84:
                pred = mat2d.T            # transpose to [N, 84]
            else:
                raise ValueError(f"Unexpected (h,w)=({h},{w}) for c=1; expected one dim == 84")
        elif c == 84:
            mat3d = flat.reshape(c, h, w)
            pred = mat3d.reshape(84, -1).T  # -> [N,84]
        else:
            raise ValueError(f"Unexpected out.c={c}; expected 1 or 84")

        if pred.shape[1] != 84:
            raise ValueError(f"pred has wrong shape {pred.shape}, expected (*,84)")
        boxes = pred[:, 0:4].astype(np.float32)  

        cls_scores = pred[:, 4:].astype(np.float32)  
        person_scores = cls_scores[:, PERSON_CLASS_ID]

        keep = person_scores >= self.conf
        boxes = boxes[keep]
        person_scores = person_scores[keep]

        if boxes.shape[0] == 0:
            if debug:
                print("no boxes over conf", file=sys.stderr)
            return []

        # xywh (cx,cy,w,h) -> xyxy in 320-space
        cx = boxes[:, 0]
        cy = boxes[:, 1]
        bw = boxes[:, 2]
        bh = boxes[:, 3]

        x1 = cx - bw / 2.0
        y1 = cy - bh / 2.0
        x2 = cx + bw / 2.0
        y2 = cy + bh / 2.0

        # Undo letterbox: (coord - pad) / scale
        x1 = (x1 - pad_x) / scale
        y1 = (y1 - pad_y) / scale
        x2 = (x2 - pad_x) / scale
        y2 = (y2 - pad_y) / scale

        # Clip to original frame (float first)
        x1 = np.clip(x1, 0, orig_w - 1)
        y1 = np.clip(y1, 0, orig_h - 1)
        x2 = np.clip(x2, 0, orig_w - 1)
        y2 = np.clip(y2, 0, orig_h - 1)

        # Filter degenerate boxes BEFORE int conversion
        w = x2 - x1
        h = y2 - y1
        valid = (w >= 2.0) & (h >= 2.0)
        x1 = x1[valid]; y1 = y1[valid]; x2 = x2[valid]; y2 = y2[valid]
        person_scores = person_scores[valid]

        if x1.size == 0:
            if debug:
                print("all boxes degenerate after clipping", file=sys.stderr)
            return []

        if debug:
            print("pred shape:", pred.shape, file=sys.stderr)
            print("kept:", int(person_scores.size), file=sys.stderr)
            print("person prob min/max:", float(person_scores.min()), float(person_scores.max()), file=sys.stderr)
            print("sample probs:", person_scores[:5], file=sys.stderr)

        dets = []
        for i in range(len(person_scores)):
            dets.append({
                "score": float(person_scores[i]),
                "box": (int(x1[i]), int(y1[i]), int(x2[i]), int(y2[i])),
            })

        return nms(dets, self.iou)