from picamera2 import Picamera2
from libcamera import Transform
import time
import cv2
import threading

lock = threading.Lock()

cam = Picamera2()
transform = Transform(vflip=True, hflip=True)
configs = cam.create_still_configuration(main={"size": (1280, 720)}, transform=transform)
cam.configure(configs)
cam.start()
time.sleep(2)

def capture_image(quality=90) -> bytes:
    with lock:
        frame = cam.capture_array()
    
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        ok, buffer = cv2.imencode('.jpg', frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        if not ok:
            raise ValueError("Could not encode image to JPEG format")
        return buffer.tobytes()