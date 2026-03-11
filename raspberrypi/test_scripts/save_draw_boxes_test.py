import json
import subprocess
import sys
from pathlib import Path

import cv2

def draw_detections(img, dets, labels=None, min_thresh=0.6):
    labels = labels or {}
    for d in dets:
        score = float(d.get("score", 0.0))
        if score < min_thresh:
            continue
        x1, y1, x2, y2 = map(int, d.get("box", [0, 0, 0, 0]))
        cls = int(d.get("class_id", 0))
        name = labels.get(cls, str(cls))

        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        txt = f"{name} {score:.2f}"
        cv2.putText(img, txt, (x1, max(0, y1 - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA)
    return img

def main(img_path: str):
    p = subprocess.run([sys.executable, "services/ncnn_infer.py", img_path],
                       capture_output=True, text=True)
    if p.returncode != 0:
        print("ncnn_infer.py failed:\n", p.stderr, file=sys.stderr)
        raise SystemExit(p.returncode)

    dets = json.loads(p.stdout)

    img = cv2.imread(img_path)
    if img is None:
        print("Could not read image:", img_path, file=sys.stderr)
        raise SystemExit(2)

    img = draw_detections(img, dets, labels={0: "person"}, min_thresh=0.6)

    out_path = str(Path(img_path).with_suffix("")) + "_boxed.jpg"
    cv2.imwrite(out_path, img)
    print(out_path)  # print the output filename so you can find it

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python save_draw_boxes_test.py path/to/image.jpg")
        raise SystemExit(1)
    main(sys.argv[1])