from flask import Blueprint, render_template, Response, request, jsonify
import cv2
import numpy as np
import os
from datetime import datetime
import services.firebase_services as fb
import time

LATEST_STATUS_DEVICE = {} 
OFFLINE_THRESHOLD_SECONDS = 15

# This is where the latest image would be stored
# Image received from either controller
UPLOAD_PATH = "static/captures"
main = Blueprint('main', __name__)

# Helper function to save image with timestamp
# Used for Pi Camera and Controller uploads
# Should be refactored to its own module for better separation of concerns and reusability
def save_image(camera_id: str, rssi_value: int, frame: bytes) -> str:
    if not frame:
        raise ValueError("Empty frame data")
    
    image_array = np.frombuffer(frame, np.uint8)
    img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")
    
    # Add timestamp overlay
    timestamp = datetime.now().strftime("%Y/%m/%d_%H:%M:%S")
    
    save_dir = os.path.join(UPLOAD_PATH, camera_id)
    os.makedirs(save_dir, exist_ok=True)
    filename = f"{camera_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
    filepath = os.path.join(save_dir, filename)
    cv2.imwrite(filepath, img)
    
    # this runs inference in a separate process to avoid blocking the main thread
    # runs through its own virtual environment 
    # can maybe make it into its own function in the future 
    import subprocess, json
    try:
        result = subprocess.check_output([
            ".ncnn_venv/bin/python",
            "services/ncnn_infer.py",
            filepath
        ])
        people = json.loads(result)
    except Exception as e:
        print("NCNN inference error:", e)
        people = []

    # Draws the boundary boxes and labels for detected people
    # Label includes confidence score as percentage
    # Color is in BGR format 
    # Can make this into a separate function for reusability
    for p in people:
        x1, y1, x2, y2 = p["box"]
        cv2.rectangle(img, (x1, y1), (x2, y2), (245, 87, 66), 2)
        cv2.putText(img, f"person {p['score'] * 100:.1f}%", (x1, max(15, y1 - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (245, 87, 66), 2)

    # Add timestamp to image
    cv2.putText(img, timestamp, (10, img.shape[0] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    # Overwrite with annotated version
    cv2.imwrite(filepath, img)
    
    # Converts confidence score to percentage 
    people_count = len(people)
    confidence_scores = [p['score']*100 for p in people]
    
    print(f"\nMotion detected!\nLocation: {camera_id}\nTime {timestamp}\nPeople: {people_count}\n")
    for i, score in enumerate(confidence_scores):
        print(f"Person {i+1}: {score:.1f}% confidence")
    print("\n-----------------------------\n")
    
    # Send data to Firebase
    fb.add_data(camera_id, rssi_value, people_count, confidence_scores, timestamp)

    return filename

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

@main.route("/upload", methods=["POST"])
def upload():
    if not request.data or len(request.data) == 0:
        return "No image data received", 400
    
    camera_id = request.headers.get("Camera-ID", "unknown")
    rssi_at_capture = request.headers.get("RSSI", None)
    filename = save_image(camera_id, rssi_at_capture, request.data)
    
    return f"Image received and saved as {filename}", 200