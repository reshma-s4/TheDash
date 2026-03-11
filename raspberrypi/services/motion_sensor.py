'''
Handles the intiliazation and functions for a 
PIR sensor installed on the Raspberry Pi
'''

import time
import threading
from gpiozero import MotionSensor
from services.pi_camera import capture_image
from routes.main import save_image

class MotionSensorService:
    def __init__(self, pir_pin=4, camera_id="cam0", cooldown=5):
        self.pir = MotionSensor(pir_pin)
        self.camera_id = camera_id
        self.cooldown = cooldown
        self.last_motion_time = 0

    def start(self):
        time.sleep(10)  # Allow motion sensor to warm up
        self.pir.when_motion = self.on_motion_detected
    
    def on_motion_detected(self):
        current_time = time.time()
        if current_time - self.last_motion_time < self.cooldown:
            return  # Ignore motion if within cooldown period
        self.last_motion_time = current_time

        threading.Thread(target=self.capture_and_save, daemon=True).start()

    def capture_and_save(self):
        jpg = capture_image()
        save_image(self.camera_id, jpg)