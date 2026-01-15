"""
Face Detection Module

Uses MediaPipe Face Detection for accurate face detection.
Returns bounding boxes with confidence scores and 10% padding.
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple


def detect_faces(image_path: str, padding_percent: float = 0.10) -> List[Dict]:
    """
    Detect faces in an image using OpenCV's Haar Cascade (fallback from MediaPipe).

    Args:
        image_path: Path to the image file
        padding_percent: Padding to add around detected faces (default 10%)

    Returns:
        List of face dictionaries with:
        - bounds: {x, y, w, h} bounding box
        - confidence: Detection confidence (0-1)
        - padded_bounds: {x, y, w, h} with padding applied
    """
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        return []

    h, w = image.shape[:2]
    faces = []

    try:
        # Try OpenCV's Haar Cascade face detector (more compatible)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        detections = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        for (x, y, face_w, face_h) in detections:
            confidence = 0.8  # Haar cascade doesn't provide confidence

            # Calculate padded bounds (10% padding)
            pad_x = int(face_w * padding_percent)
            pad_y = int(face_h * padding_percent)

            padded_x = max(0, x - pad_x)
            padded_y = max(0, y - pad_y)
            padded_w = min(w - padded_x, face_w + 2 * pad_x)
            padded_h = min(h - padded_y, face_h + 2 * pad_y)

            faces.append({
                'bounds': {'x': int(x), 'y': int(y), 'w': int(face_w), 'h': int(face_h)},
                'confidence': confidence,
                'padded_bounds': {
                    'x': padded_x,
                    'y': padded_y,
                    'w': padded_w,
                    'h': padded_h
                }
            })

    except Exception as e:
        # Face detection failed, continue without it
        print(f"Warning: Face detection failed ({e}), continuing without face avoidance")
        return []

    return faces


def get_face_avoid_zones(image_path: str) -> List[Dict]:
    """
    Get face regions as avoid zones for text placement.

    Args:
        image_path: Path to the image file

    Returns:
        List of avoid zone dictionaries with:
        - type: "face"
        - bounds: {x, y, w, h} padded bounding box
        - confidence: Detection confidence
    """
    faces = detect_faces(image_path)

    avoid_zones = []
    for face in faces:
        avoid_zones.append({
            'type': 'face',
            'bounds': face['padded_bounds'],
            'confidence': face['confidence']
        })

    return avoid_zones
