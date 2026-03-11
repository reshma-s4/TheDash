import sys
import json
import traceback
from pathlib import Path

# make project root importable
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

import cv2

try:
    from services.yolo8_ncnn import YOLOv8NCNN
except Exception:
    traceback.print_exc(file=sys.stderr)
    sys.exit(3)

MODEL_PARAM = str(BASE_DIR / "models/yolov8n_ncnn_model/model.ncnn.param")
MODEL_BIN   = str(BASE_DIR / "models/yolov8n_ncnn_model/model.ncnn.bin")
INPUT_SIZE = 640

if not Path(MODEL_PARAM).exists() or not Path(MODEL_BIN).exists():
    print(json.dumps([]))  
    print(f"MODEL FILES MISSING: {MODEL_PARAM} or {MODEL_BIN}", file=sys.stderr)
    sys.exit(4)

# initialize once to avoid loading model at each inference call 
try:
    yolo = YOLOv8NCNN(param_path=MODEL_PARAM, bin_path=MODEL_BIN, input_size=INPUT_SIZE, conf=0.35, iou=0.5, num_threads=4)
except Exception:
    traceback.print_exc(file=sys.stderr)
    sys.exit(5)

def main(img_path: str):
    img = cv2.imread(img_path)
    if img is None:
        print(json.dumps([]))
        print(f"Could not read image: {img_path}", file=sys.stderr)
        sys.exit(6)

    try:
        people = yolo.detect_people(img)
    except Exception:
        traceback.print_exc(file=sys.stderr)
        print(json.dumps([]))
        sys.exit(7)

    out = []
    for d in people:
        out.append({
            "score": float(d.get("score", 0.0)),
            "box": [int(x) for x in d.get("box", [0,0,0,0])],
            "class_id": 0
        })

    # PRINT JSON ONLY to stdout
    print(json.dumps(out), flush=True)

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps([]))
            print("usage: ncnn_infer.py /path/to/image.jpg", file=sys.stderr)
            sys.exit(1)
        main(sys.argv[1])
    except Exception:
        traceback.print_exc(file=sys.stderr)
        sys.exit(2)