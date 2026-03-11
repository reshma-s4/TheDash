import os
import json
import sys
import subprocess
import cv2

BASE_DIR = "/home/thedash-admin/thedash/raspberrypi"
NCNN_PY = os.path.join(BASE_DIR, ".ncnn_venv/bin/python")
NCNN_INFER = os.path.join(BASE_DIR, "services/ncnn_infer.py")

def main(img_path: str):
    img_bgr = cv2.imread(img_path)
    if img_bgr is None:
        raise SystemExit(f"Could not read image: {img_path}")

    proc = subprocess.run(
    [NCNN_PY, NCNN_INFER, img_path],
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
        
    print("People:", len(people))

    for p in people:
        x1, y1, x2, y2 = p["box"]
        score = p.get("score", 0.0)
        cv2.rectangle(img_bgr, (x1, y1), (x2, y2), (0,255,255), 2)
        cv2.putText(img_bgr, f"person {score:.2f}", (x1, max(15, y1 - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,255), 2)

    out_path = img_path.replace(".jpg", "_ann.jpg")
    cv2.imwrite(out_path, img_bgr)
    print("Wrote:", out_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python test_ncnn_on_image.py path/to/image.jpg")
    main(sys.argv[1])