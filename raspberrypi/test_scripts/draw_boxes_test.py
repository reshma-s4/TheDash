import json
import subprocess
import sys
import cv2
from services.draw_boxes import draw_detections

def main(img_path: str):
    # 1) run inference script to get JSON detections
    p = subprocess.run([sys.executable, "services/ncnn_infer.py", img_path],
                       capture_output=True, text=True)
    if p.returncode != 0:
        print("ncnn_infer.py failed:", p.stderr)
        return

    dets = json.loads(p.stdout)

    # 2) load image
    frame = cv2.imread(img_path)
    if frame is None:
        print("Could not read image:", img_path)
        return

    # 3) draw + show
    labels = {0: "person"}
    frame = draw_detections(frame, dets, labels=labels, min_thresh=0.6)

    cv2.imshow("NCNN detections", frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python test/show_ncnn_boxes.py path/to/image.jpg")
        raise SystemExit(1)
    main(sys.argv[1])