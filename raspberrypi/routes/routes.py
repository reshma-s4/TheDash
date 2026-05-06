from flask import Blueprint, render_template, Response, request, jsonify
import os
from datetime import datetime
import time

from services.image_handler import UPLOAD_PATH, save_image

LATEST_STATUS_DEVICE = {} 
OFFLINE_THRESHOLD_SECONDS = 15

main = Blueprint('main', __name__)

# Displays the latest image from each camera on the 
# homepage, along with their proximity labels
@main.route("/")
def home():
    cameras = {}
    # Loop through all camera directories
    if os.path.exists(UPLOAD_PATH):
        for camera_id in os.listdir(UPLOAD_PATH):
            cam_dir = os.path.join(UPLOAD_PATH, camera_id)
            if os.path.isdir(cam_dir):
                # Find the latest file in this directory
                files = [f for f in os.listdir(cam_dir) if f.endswith(".jpg")]
                if files:
                    latest_file = max(
                        files,
                        key=lambda f: os.path.getctime(os.path.join(cam_dir, f))
                    )
                    cameras[camera_id] = f"/{cam_dir}/{latest_file}"
                else:
                    cameras[camera_id] = None
    else:
        cameras = {}

    return render_template("index.html", cameras=cameras, time_now=datetime.now().timestamp())

# Used to view status of connected edge devices, used to 
# check functionality and relative distance to Pi 
@main.route("/status", methods=["POST"])
def status():
    data = request.get_json(silent=True) or {}

    camera_id = data.get("camera_id") or request.headers.get("Camera-ID") or "unknown"
    rssi_value = data.get("rssi") if data else request.headers.get("RSSI-value")
    signal_percent = data.get("signal_percent") if data else request.headers.get("Signal-strength")

    try:
        rssi_value = int(rssi_value) if rssi_value is not None else None
    except:
        rssi_value = None

    try:
        signal_percent = int(signal_percent) if signal_percent is not None else None
    except:
        signal_percent = None
        
    now = time.time()

    LATEST_STATUS_DEVICE[camera_id] = {
        "camera_id": camera_id,
        "rssi": rssi_value,
        "signal_percent": signal_percent,
        "ip": data.get("ip") if data else request.remote_addr,
        "last_seen_epoch":now,
        "last_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    return jsonify({"ok": True})

@main.route("/status", methods=["GET"])
def status_page():
    now = time.time()
    cameras = []

    for cam_id in sorted(LATEST_STATUS_DEVICE.keys()):
        c = dict(LATEST_STATUS_DEVICE[cam_id])
        age = now - c.get("last_seen_epoch", 0)
        c["age_secs"] = int(age)
        c["online"] = age <= OFFLINE_THRESHOLD_SECONDS
        cameras.append(c)

    return render_template(
        "status.html",
        cameras=cameras,
        offline_after_secs=OFFLINE_THRESHOLD_SECONDS,
        time_now=datetime.now().timestamp()
    )
# Receives capturead frames from edge devices
@main.route("/upload", methods=["POST"])
def upload():
    if not request.data or len(request.data) == 0:
        return "No image data received", 400
    
    camera_id = request.headers.get("Camera-ID", "unknown")
    rssi_at_capture = request.headers.get("RSSI", None)
    filename = save_image(camera_id, rssi_at_capture, request.data)
    
    return f"Image received and saved as {filename}", 200