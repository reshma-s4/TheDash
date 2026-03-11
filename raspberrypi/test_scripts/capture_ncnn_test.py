import os
import json
import time
import subprocess
from datetime import datetime

import cv2
import numpy as np
from picamera2 import Picamera2
from libcamera import Transform

BASE_DIR = "/home/thedash-admin/repos/TheDash/raspberrypi"
OUT_DIR = os.path.join(BASE_DIR, "static/captures/test")
os.makedirs(OUT_DIR, exist_ok=True)

NCNN_PY = os.path.join(BASE_DIR, ".ncnn_venv/bin/python")
NCNN_INFER = os.path.join(BASE_DIR, "services/ncnn_infer.py")

def main():
    picam2 = Picamera2()
    transform = Transform(vflip=True, hflip=True)
    
    config = picam2.create_still_configuration(main={"size": (1280, 720)}, transform=transform)
    picam2.configure(config)
    picam2.start()
    time.sleep(0.5)

    # 2) Capture a frame (RGB)
    frame_rgb = picam2.capture_array()
    picam2.stop()

    # Convert RGB -> BGR for OpenCV saving/drawing
    img_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_path = os.path.join(OUT_DIR, f"raw_{ts}.jpg")
    ann_path = os.path.join(OUT_DIR, f"ann_{ts}.jpg")

    # 3) Save raw image
    cv2.imwrite(raw_path, img_bgr)
    print("Saved raw:", raw_path)

    # 4) Run NCNN inference (separate venv)
    proc = subprocess.run(
    [NCNN_PY, NCNN_INFER, raw_path],
    text=True,
    capture_output=True
    )

    if proc.returncode != 0:
        print("NCNN inference failed rc=", proc.returncode)
        print("STDERR:\n", proc.stderr)
        print("STDOUT:\n", proc.stdout)
        people = []
    else:
        # Some tools might add trailing newlines; strip is fine
        people = json.loads(proc.stdout.strip())

    print("People detections:", len(people))
    if people:
        for i, p in enumerate(people):
            print(f"Det {i}: {p}")

    # 5) Draw boxes on the BGR image
    for p in people:
        x1, y1, x2, y2 = p["box"]
        score = p.get("score", 0.0)
        cv2.rectangle(img_bgr, (x1, y1), (x2, y2), (0, 255, 255), 2)
        cv2.putText(img_bgr, f"person {score:.2f}", (x1, max(15, y1 - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2, cv2.LINE_AA)

    # Timestamp overlay
    cv2.putText(img_bgr, ts, (10, img_bgr.shape[0] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2, cv2.LINE_AA)

    # 6) Save annotated image
    cv2.imwrite(ann_path, img_bgr)
    print("Saved annotated:", ann_path)

if __name__ == "__main__":
    main()