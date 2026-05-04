import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path

_firebase_app = None
_client = None

# Fixes issues with paths 
ROOT_DIR = Path(__file__).resolve().parents[1]
CRED_PATH = ROOT_DIR / "firebase_creds" / "login-75a8b-firebase-adminsdk-fbsvc-3a9cd30a5c.json"
CRED_PATH = str(CRED_PATH)

def init_firebase():
    global _firebase_app, _client
    if _firebase_app is not None:
        return _firebase_app
    
    creds = credentials.Certificate(CRED_PATH)
    _firebase_app = firebase_admin.initialize_app(creds)
    _client = firestore.client()
    return _firebase_app

def get_db():
    global _client

    if _client is None:
        init_firebase()
    return _client

def add_data(camera_id, rssi_value, people_count, confidence_scores, time_of_capture, floor=1):
    db = get_db()
    
    data = {
        "cameraID": camera_id,
        "rssi": rssi_value,
        "timestamp": time_of_capture,
        "count": people_count,
        "confidence_scores": confidence_scores,
        "floor": floor
    }

    db.collection("pi_data").add(data)
    
def upsert_camera_data(camera_id, rssi_value, people_count, confidence_scores, time_of_capture, floor=1):
    db = get_db()
    
    data = {
        "cameraID": camera_id,
        "rssi": rssi_value,
        "timestamp": time_of_capture,
        "count": people_count,
        "confidence_scores": confidence_scores,
        "floor": floor
    }

    db.collection("pi_data").document(camera_id).set(data, merge=True)

