import os
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import torch
from ultralytics import YOLO

logger = logging.getLogger("railguard.detector")

# Default configurations from environment or sensible defaults
DEFAULT_MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(__file__), "..", "models", "best.pt"))
DEFAULT_CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.40"))
INFERENCE_IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "640"))


class DefectDetector:
    """
    Singleton service for YOLO11n Railway Defect Detection.
    Loads the model once at startup and performs optimized inference.
    """
    _instance: Optional["DefectDetector"] = None

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or DEFAULT_MODEL_PATH
        
        # Resolve path if relative
        if not os.path.isabs(self.model_path):
            self.model_path = os.path.abspath(self.model_path)

        # Fallback check to Models or Model Dataset directory if best.pt is missing
        if not os.path.exists(self.model_path):
            candidates = [
                os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Models", "YOLOv11", "YOLO11_railway_defect_best.pt")),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Model Dataset", "YOLOv11", "YOLO11_railway_defect_best.pt")),
            ]
            for cand in candidates:
                if os.path.exists(cand):
                    logger.info(f"Model not found at {self.model_path}. Using fallback: {cand}")
                    self.model_path = cand
                    break

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}")

        # Determine target device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        logger.info("RailGuard backend starting")
        logger.info(f"Loading YOLO11n model weights from: {self.model_path}")
        self.model = YOLO(self.model_path)
        
        # Log exact device format
        device_label = "CUDA" if self.device == "cuda" else "CPU"
        logger.info("YOLO11n model loaded")
        logger.info(f"Device: {device_label}")
        print(f"RailGuard backend started\nYOLO11n model loaded\nDevice: {device_label}")

        # Read actual class names directly from model
        self.class_names: Dict[int, str] = {int(k): str(v) for k, v in self.model.names.items()}
        logger.info(f"Loaded detector ({len(self.class_names)} classes): {self.class_names}")

    @classmethod
    def get_instance(cls, model_path: Optional[str] = None) -> "DefectDetector":
        """Singleton accessor to ensure model is only loaded once."""
        if cls._instance is None:
            cls._instance = cls(model_path)
        return cls._instance

    def predict(
        self,
        image_rgb: np.ndarray,
        confidence_threshold: Optional[float] = None
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Runs YOLO11n inference on an RGB image array with IoU=0.50.
        Returns: (detections, inference_time_ms)
        """
        conf_thr = confidence_threshold if confidence_threshold is not None else DEFAULT_CONFIDENCE_THRESHOLD

        start_time = time.perf_counter()

        # Run Ultralytics inference with explicit iou=0.50 and frontend confidence threshold
        results = self.model.predict(
            source=image_rgb,
            conf=conf_thr,
            iou=0.50,
            imgsz=INFERENCE_IMAGE_SIZE,
            device=self.device,
            verbose=False
        )

        inference_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        detections: List[Dict[str, Any]] = []

        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes
            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    cls_name = self.class_names.get(cls_id, "defect")
                    confidence = round(float(box.conf[0].item()), 4)
                    
                    # Bounding box xyxy coordinates
                    coords = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = round(coords[0], 2), round(coords[1], 2), round(coords[2], 2), round(coords[3], 2)

                    bbox_dict = {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2
                    }

                    detections.append({
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": confidence,
                        "box": bbox_dict,
                        "bbox": bbox_dict
                    })

        # Sort detections by confidence descending
        detections.sort(key=lambda d: d["confidence"], reverse=True)

        return detections, inference_time_ms
