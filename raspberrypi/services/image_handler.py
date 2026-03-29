import os
import cv2
import numpy as np
from datetime import datetime
import services.firebase_services as fb

UPLOAD_PATH = "static/captures"

def estimate_proximity(box, frame_size):
    x1, y1, x2, y2 = box
    frame_height, frame_width = frame_size[:2]
    box_width = max(0, x2 - x1)
    box_height = max(0, y2 - y1)
    
    box_area = float(box_width * box_height)
    frame_area = float(frame_width * frame_height)
    
    area_ratio = box_area / frame_area if frame_area > 0 else 0.0
    height_ratio = box_height / frame_height if frame_height > 0 else 0.0
    if height_ratio >= 0.5 or area_ratio >= 0.18:
        label = "near"
    elif height_ratio >= 0.25 or area_ratio >= 0.06:
        label = "mid"
    else:
        label = "far"
    
    return {
        "area_ratio": area_ratio,
        "height_ratio": height_ratio,
        "proximity_label": label
    }
    
def draw_boxes_and_labels(frame, people):
    people_boxes = []
    
    for index, person in enumerate(people, start=1):
        x1, y1, x2, y2 = person["box"]
        confidence = float(person["score"])
        
        proximity = estimate_proximity((x1,y1,x2,y2), frame.shape)
        proximity_label = proximity["proximity_label"]
        
        cv2.rectangle(frame, (x1, y1), (x2, y2), (211, 199, 93), 2)
        
        label = f"person {confidence * 100:.1f}% | {proximity_label}"
        
        cv2.putText(frame, 
                    label, 
                    (x1, max(20, y1 - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.7, 
                    (211, 199, 93), 2
        )
        
        people_boxes.append({
            **person,
            "proximity": proximity_label,
            "area_ratio": proximity["area_ratio"],
            "height_ratio": proximity["height_ratio"],
            })
        
    return people_boxes
        
        
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
    # Label includes confidence score as percentage and 
    # proximity estimation (near, mid, far) based on box size 
    # and position in frame
    # Color is in BGR format 
    people = draw_boxes_and_labels(img, people)
    
    # Add timestamp to image
    cv2.putText(img, timestamp, (10, img.shape[0] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    # Overwrite with annotated version
    cv2.imwrite(filepath, img)
    
    # Converts confidence score to percentage 
    people_count = len(people)
    confidence_scores = [p['score']*100 for p in people]
    proximity_labels = [p['proximity'] for p in people]
    
    print(f"\nMotion detected!\nLocation: {camera_id}\nTime {timestamp}\nPeople: {people_count}\n")
    for i, person in enumerate(people, start=1):
        print(
            f"Person {i}: " 
            f"{person['score'] * 100:.1f}% confidence | "
            f"{person['proximity']} | "
            f"{person['area_ratio']:.2f} | "
            f"{person['height_ratio']:.2f}"
            )
    print("\n-----------------------------\n")
    
    # Send data to Firebase
    fb.add_data(camera_id, rssi_value, people_count, confidence_scores, timestamp)

    return filename