# YOLOv8 TFLite object detection service.
# This version isn't currently being used for our project. 
# It was an initial attempt to run YOLOv8 in TFLite on the Raspberry Pi, 
# but we switched to a more lightweight NCNN model for better performance and compatibility.
# However, this code is kept for reference and potential future use if we want to run more 
# powerful models on the Pi or other platforms.


from __future__ import annotations
from dataclasses import dataclass
from typing import List, Tuple
import numpy as np
import cv2

from tflite_runtime.interpreter import Interpreter

@dataclass
class Detection:
    label: str
    score: float
    box: Tuple[int, int, int, int]
    
# COCO80 labels (YOLOv8 pretrained)
COCO80 = [
    "person","bicycle","car","motorcycle","airplane","bus","train","truck","boat","traffic light",
    "fire hydrant","stop sign","parking meter","bench","bird","cat","dog","horse","sheep","cow",
    "elephant","bear","zebra","giraffe","backpack","umbrella","handbag","tie","suitcase","frisbee",
    "skis","snowboard","sports ball","kite","baseball bat","baseball glove","skateboard","surfboard","tennis racket",
    "bottle","wine glass","cup","fork","knife","spoon","bowl","banana","apple","sandwich","orange",
    "broccoli","carrot","hot dog","pizza","donut","cake","chair","couch","potted plant","bed",
    "dining table","toilet","tv","laptop","mouse","remote","keyboard","cell phone","microwave","oven",
    "toaster","sink","refrigerator","book","clock","vase","scissors","teddy bear","hair drier","toothbrush"
]


def letterbox_image(img: np.ndarray, new_size: int) -> Tuple[np.ndarray, float, int, int]:
    """
    Resize and pad image to square (new_size x new_size) while keeping aspect ratio.

    Returns:
      - letterboxed image (H=W=new_size)
      - scale (float) used to resize original image
      - pad_x (int) horizontal padding (left)
      - pad_y (int) vertical padding (top)
    """
    h, w = img.shape[:2]
    scale = min(new_size / h, new_size / w)

    new_w = int(round(w * scale))
    new_h = int(round(h * scale))
    
    #DEBUG
    #print(f"New height: {new_h} New width: {new_w}")

    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    canvas = np.zeros((new_size, new_size, 3), dtype=np.uint8)
    pad_x = (new_size - new_w) // 2
    pad_y = (new_size - new_h) // 2
    canvas[pad_y:pad_y + new_h, pad_x:pad_x + new_w] = resized

    return canvas, scale, pad_x, pad_y


def _iou_xyxy(a, b) -> float:
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
    union = area_a + area_b - inter + 1e-9
    return inter / union


def nms(dets: List[Detection], iou_thresh: float) -> List[Detection]:
    dets = sorted(dets, key=lambda d: d.score, reverse=True)
    keep: List[Detection] = []
    while dets:
        best = dets.pop(0)
        keep.append(best)
        dets = [d for d in dets if _iou_xyxy(best.box, d.box) < iou_thresh or best.label != d.label]
    return keep


class YOLOv8TFLiteDetector:
    def __init__(
        self,
        model_path: str,
        conf_thresh: float = 0.35,
        iou_thresh: float = 0.5,
        num_threads: int = 4,
        labels: List[str] | None = None,
    ):
        self.labels = labels or COCO80
        self.conf_thresh = float(conf_thresh)
        self.iou_thresh = float(iou_thresh)

        self.itp = Interpreter(model_path=model_path, num_threads=num_threads)
        self.itp.allocate_tensors()
        self.inp = self.itp.get_input_details()[0]
        self.out = self.itp.get_output_details()[0]

        # Expect [1,320,320,3] float32
        _, self.in_h, self.in_w, _ = self.inp["shape"]
        if self.inp["dtype"] != np.float32:
            raise ValueError(f"Expected float32 input, got {self.inp['dtype']}")

    def detect(self, frame_rgb: np.ndarray) -> List[Detection]:
        """
        frame_rgb: HxWx3 uint8 RGB (Picamera2 capture_array()).
        Returns boxes in original frame pixel coords.
        """
        orig_h, orig_w = frame_rgb.shape[:2]
        
        #DEBUG
        #print(f"Original height: {orig_h} Original width: {orig_w}")

        # 1) Letterbox to model input size (keeps aspect ratio + padding)
        img_letterbox, scale, pad_x, pad_y = letterbox_image(frame_rgb, self.in_w)

        # 2) Preprocess: normalize to 0..1 float32 (model is float32)
        inp = img_letterbox.astype(np.float32) / 255.0
        inp = np.expand_dims(inp, 0)  # [1,H,W,3]

        # 3) Inference
        self.itp.set_tensor(self.inp["index"], inp)
        self.itp.invoke()
        out = self.itp.get_tensor(self.out["index"])  # [1,84,2100] expected
        preds = out[0].T  # -> [2100,84] (N, 4 + num_classes)

        # 4) Parse predictions
        boxes_xywh = preds[:, 0:4]     # x, y, w, h (in model-space coordinates)
        class_scores = preds[:, 4:]    # class logits/scores
        cls_ids = np.argmax(class_scores, axis=1)
        scores = class_scores[np.arange(class_scores.shape[0]), cls_ids]

        # 5) Confidence filtering
        keep_mask = scores >= self.conf_thresh
        boxes_xywh = boxes_xywh[keep_mask]
        scores = scores[keep_mask]
        cls_ids = cls_ids[keep_mask]

        if boxes_xywh.shape[0] == 0:
            return []

        # 6) Convert xywh -> xyxy in model-space
        x = boxes_xywh[:, 0]
        y = boxes_xywh[:, 1]
        w = boxes_xywh[:, 2]
        h = boxes_xywh[:, 3]
        x1 = x - w / 2.0
        y1 = y - h / 2.0
        x2 = x + w / 2.0
        y2 = y + h / 2.0

        # 7) Undo letterbox: remove padding, then divide by scale to go back to original pixels
        #    Note: model-space coords are in [0..self.in_w/self.in_h] pixel units of the letterbox image (0..320).
        #    After removing pad and dividing by scale you get original image pixel coords.
        x1 = (x1 - pad_x) / scale
        y1 = (y1 - pad_y) / scale
        x2 = (x2 - pad_x) / scale
        y2 = (y2 - pad_y) / scale

        # 8) Clip and convert to integers
        x1 = np.clip(x1, 0, orig_w - 1).astype(int)
        y1 = np.clip(y1, 0, orig_h - 1).astype(int)
        x2 = np.clip(x2, 0, orig_w - 1).astype(int)
        y2 = np.clip(y2, 0, orig_h - 1).astype(int)

        # 9) Build Detection list
        dets: List[Detection] = []
        for i in range(len(scores)):
            cls = int(cls_ids[i])
            label = self.labels[cls] if 0 <= cls < len(self.labels) else f"class_{cls}"
            dets.append(Detection(label=label, score=float(scores[i]), box=(int(x1[i]), int(y1[i]), int(x2[i]), int(y2[i]))))

        # 10) NMS
        return nms(dets, self.iou_thresh)

    @staticmethod
    def _resize_rgb(img_rgb: np.ndarray, size_wh: Tuple[int, int]) -> np.ndarray:
        w, h = size_wh
        # Prefer cv2 if present, else PIL
        try:
            import cv2
            return cv2.resize(img_rgb, (w, h), interpolation=cv2.INTER_LINEAR)
        except Exception:
            from PIL import Image
            return np.array(Image.fromarray(img_rgb).resize((w, h)))