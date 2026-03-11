import cv2
import numpy as np

img = cv2.imread("test_marker.jpg")

aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
aruco_params = cv2.aruco.DetectorParameters()

def detect_markers(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    corners, ids, _ = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=aruco_params)

    markers = []
    if ids is not None:
        for i in range(len(ids)):
            marker_info = {
                "id": int(ids[i][0]),
                "corners": corners[i].tolist()  # Convert numpy array to list for JSON serialization
            }
            markers.append(marker_info)

    return markers