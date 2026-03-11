import cv2

BBOX_COLORS = [
    (164,120,87), (68,148,228), (93,97,209), (178,182,133), (88,159,106),
    (96,202,231), (159,124,168), (169,162,241), (98,118,150), (172,176,184)
]

def draw_detections(frame, detections, labels=None, min_thresh=0.5):
    """
    detections: list of dicts like:
      {"score": 0.78, "box": [xmin, ymin, xmax, ymax], "class_id": 0}
    labels: dict or list mapping class_id -> name (optional)
    """
    h, w = frame.shape[:2]

    for det in detections:
        conf = float(det.get("score", 0.0))
        if conf < min_thresh:
            continue

        box = det.get("box", [0,0,0,0])
        xmin, ymin, xmax, ymax = [int(x) for x in box]

        # Clamp for safety
        xmin = max(0, min(xmin, w-1))
        xmax = max(0, min(xmax, w-1))
        ymin = max(0, min(ymin, h-1))
        ymax = max(0, min(ymax, h-1))

        class_id = int(det.get("class_id", 0))
        color = BBOX_COLORS[class_id % len(BBOX_COLORS)]

        # Rectangle
        cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)

        # Label text
        if labels is None:
            classname = "object"
        else:
            # labels can be dict or list
            classname = labels[class_id] if not isinstance(labels, dict) else labels.get(class_id, "object")

        label = f"{classname}: {int(conf*100)}%"
        labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        label_ymin = max(ymin, labelSize[1] + 10)

        cv2.rectangle(
            frame,
            (xmin, label_ymin - labelSize[1] - 10),
            (xmin + labelSize[0], label_ymin + baseLine - 10),
            color,
            cv2.FILLED
        )
        cv2.putText(frame, label, (xmin, label_ymin - 7),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 1)

    return frame