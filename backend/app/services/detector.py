import os
import time
import io
import cv2
import numpy as np
import yaml
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image, ImageOps
from ultralytics import YOLO
import torch

from ..config import BASE_DIR, ROOT_DIR, settings

class DetectorService:
    def __init__(self):
        self.model: Optional[YOLO] = None
        self.model_path: Optional[str] = None
        self.device: str = "cpu"
        self.task: str = "detect"
        self.class_names: Dict[int, str] = {0: "defect"}
        self.yaml_classes: List[str] = ["defect"]
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None

    @staticmethod
    def _resolve_model_path(configured_path: str) -> Path:
        """Resolve a model path consistently from any server working directory."""
        configured = Path(configured_path).expanduser()
        if configured.is_absolute():
            return configured

        candidates = [
            Path.cwd() / configured,
            ROOT_DIR / configured,
            BASE_DIR / configured,
        ]
        # Also support a bare filename such as ``best.pt`` in the standard
        # backend/models location.
        if configured.name:
            candidates.extend([
                ROOT_DIR / configured.name,
                BASE_DIR / "models" / configured.name,
            ])

        for candidate in candidates:
            if candidate.is_file():
                return candidate.resolve()
        return candidates[0].resolve()

    def load_model(self, model_path: Optional[str] = None):
        """
        Loads YOLO11s checkpoint once during startup.
        """
        path_to_use = str(self._resolve_model_path(model_path or settings.MODEL_PATH))
        if not os.path.isfile(path_to_use):
            raise FileNotFoundError(
                f"Model file not found: {path_to_use}. "
                "Set MODEL_PATH to the deployed checkpoint location."
            )

        self.model_path = path_to_use
        
        # Read data.yaml if available to verify class config
        yaml_path = settings.DATA_YAML_PATH
        if os.path.exists(yaml_path):
            try:
                with open(yaml_path, "r", encoding="utf-8") as yf:
                    data_cfg = yaml.safe_load(yf)
                    if "names" in data_cfg:
                        if isinstance(data_cfg["names"], list):
                            self.yaml_classes = data_cfg["names"]
                        elif isinstance(data_cfg["names"], dict):
                            self.yaml_classes = list(data_cfg["names"].values())
            except Exception as e:
                print(f"[DetectorService] Warning reading data.yaml: {e}")

        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model = YOLO(self.model_path)
            self.task = getattr(self.model, "task", "detect") or "detect"
            
            # Extract names from model
            raw_names = getattr(self.model, "names", {0: "defect"})
            if isinstance(raw_names, dict):
                self.class_names = {int(k): str(v) for k, v in raw_names.items()}
            elif isinstance(raw_names, list):
                self.class_names = {i: str(n) for i, n in enumerate(raw_names)}
            else:
                self.class_names = {0: "defect"}

            self.is_loaded = True
            self.load_error = None
            print(f"[DetectorService] YOLO11s model loaded from {self.model_path} on {self.device}. Task: {self.task}, Classes: {self.class_names}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[DetectorService] Error loading model from {self.model_path}: {e}")
            raise

    def get_model_info(self) -> Dict[str, Any]:
        """
        Returns verified model metadata.
        """
        weights_size_mb = 0.0
        if self.model_path and os.path.exists(self.model_path):
            weights_size_mb = round(os.path.getsize(self.model_path) / (1024 * 1024), 2)

        return {
            "name": "YOLO11s",
            "task": self.task,
            "class_count": len(self.class_names),
            "class_names": self.class_names,
            "verified_classes": list(self.class_names.values()),
            "weights_path": str(self.model_path or settings.MODEL_PATH),
            "weights_size_mb": weights_size_mb,
            "architecture": "YOLO11s (Ultralytics)",
            "input_resolution": 640,
            "device": self.device,
            "framework_version": "ultralytics 8.4.173",
            "torch_version": torch.__version__,
        }

    def detect(
        self, image_bytes: bytes, conf_threshold: float = 0.25
    ) -> Tuple[List[Dict[str, Any]], float, bytes, int, int]:
        """
        Runs YOLO11s inference on input image.
        Returns:
            (detections, inference_time_ms, annotated_jpeg_bytes, width, height)
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded. Cannot run inference.")

        # Decode image safely via PIL with EXIF orientation handling
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            pil_img = ImageOps.exif_transpose(pil_img)
            orig_w, orig_h = pil_img.size
            # Convert to RGB numpy array
            rgb_np = np.array(pil_img.convert("RGB"))
        except Exception as e:
            raise ValueError(f"Failed to decode image: {e}")

        # Run inference and measure time
        start_time = time.perf_counter()
        results = self.model.predict(
            source=rgb_np,
            conf=conf_threshold,
            device=self.device,
            verbose=False
        )
        end_time = time.perf_counter()
        inference_time_ms = round((end_time - start_time) * 1000, 2)

        detections: List[Dict[str, Any]] = []
        result = results[0]

        # Extract boxes
        if result.boxes is not None and len(result.boxes) > 0:
            boxes = result.boxes
            xyxy = boxes.xyxy.cpu().numpy()
            confs = boxes.conf.cpu().numpy()
            clss = boxes.cls.cpu().numpy()

            for i in range(len(xyxy)):
                x1, y1, x2, y2 = xyxy[i]
                conf = float(confs[i])
                cls_id = int(clss[i])
                # Always use the verified generic class label 'defect'
                raw_name = self.class_names.get(cls_id, "defect")
                class_name = raw_name.lower()

                detections.append({
                    "class_id": cls_id,
                    "class_name": class_name,
                    "confidence": round(conf, 4),
                    "confidence_percent": round(conf * 100, 2),
                    "bbox": [
                        round(float(x1), 2),
                        round(float(y1), 2),
                        round(float(x2), 2),
                        round(float(y2), 2)
                    ]
                })

        # Generate custom premium industrial annotation
        annotated_bytes = self._render_annotations(rgb_np, detections)

        return detections, inference_time_ms, annotated_bytes, orig_w, orig_h

    def _render_annotations(self, rgb_img: np.ndarray, detections: List[Dict[str, Any]]) -> bytes:
        """
        Draws high-contrast, professional industrial annotations:
        - Electric lime bounding boxes (#CCFF00 / BGR (0, 255, 204))
        - Technical corner ticks
        - Dark pill badge with electric lime text: 'DEFECT 88.5%'
        """
        # Work in BGR for OpenCV
        bgr = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR)
        h, w = bgr.shape[:2]

        line_thick = max(2, int(round(min(w, h) / 320)))
        font_scale = max(0.45, min(w, h) / 950.0)
        font_thick = max(1, int(round(line_thick * 0.75)))

        # Colors (BGR)
        # Electric Lime / Neon: RGB(163, 230, 53) -> BGR(53, 230, 163) or Neon Green BGR(0, 255, 180)
        box_color = (30, 240, 180)       # Electric lime/neon in BGR
        bg_pill_color = (15, 23, 42)      # Deep graphite pill (slate-900)
        text_color = (255, 255, 255)      # Crisp white

        for det in detections:
            x1, y1, x2, y2 = [int(round(coord)) for coord in det["bbox"]]
            conf_pct = det["confidence_percent"]
            label_text = f"DEFECT  {conf_pct:.1f}%"

            # Draw main bounding box
            cv2.rectangle(bgr, (x1, y1), (x2, y2), box_color, line_thick, cv2.LINE_AA)

            # Draw corner accents for high-tech HUD effect
            corner_len = max(12, int(min(x2 - x1, y2 - y1) * 0.2))
            corner_thick = line_thick + 2
            # Top-left
            cv2.line(bgr, (x1, y1), (x1 + corner_len, y1), box_color, corner_thick, cv2.LINE_AA)
            cv2.line(bgr, (x1, y1), (x1, y1 + corner_len), box_color, corner_thick, cv2.LINE_AA)
            # Top-right
            cv2.line(bgr, (x2, y1), (x2 - corner_len, y1), box_color, corner_thick, cv2.LINE_AA)
            cv2.line(bgr, (x2, y1), (x2, y1 + corner_len), box_color, corner_thick, cv2.LINE_AA)
            # Bottom-left
            cv2.line(bgr, (x1, y2), (x1 + corner_len, y2), box_color, corner_thick, cv2.LINE_AA)
            cv2.line(bgr, (x1, y2), (x1, y2 - corner_len), box_color, corner_thick, cv2.LINE_AA)
            # Bottom-right
            cv2.line(bgr, (x2, y2), (x2 - corner_len, y2), box_color, corner_thick, cv2.LINE_AA)
            cv2.line(bgr, (x2, y2), (x2, y2 - corner_len), box_color, corner_thick, cv2.LINE_AA)

            # Measure text size
            (tw, th), baseline = cv2.getTextSize(
                label_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thick
            )

            # Calculate badge position
            pad = 6
            pill_y1 = max(0, y1 - th - (pad * 2))
            pill_y2 = y1 if y1 - th - (pad * 2) >= 0 else y1 + th + (pad * 2)
            pill_x1 = max(0, x1)
            pill_x2 = min(w, x1 + tw + (pad * 2) + 8)

            # Draw badge background pill
            cv2.rectangle(bgr, (pill_x1, pill_y1), (pill_x2, pill_y2), bg_pill_color, -1)
            cv2.rectangle(bgr, (pill_x1, pill_y1), (pill_x2, pill_y2), box_color, 1, cv2.LINE_AA)

            # Draw small indicator dot inside badge
            dot_center = (pill_x1 + pad + 4, (pill_y1 + pill_y2) // 2)
            cv2.circle(bgr, dot_center, max(2, int(line_thick * 0.8)), box_color, -1, cv2.LINE_AA)

            # Draw label text
            text_x = pill_x1 + pad + 12
            text_y = pill_y2 - pad - int(baseline / 2)
            cv2.putText(
                bgr,
                label_text,
                (text_x, text_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                text_color,
                font_thick,
                cv2.LINE_AA
            )

        # Encode to JPEG
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 95]
        success, encoded = cv2.imencode(".jpg", bgr, encode_params)
        if not success:
            raise RuntimeError("Failed to encode annotated image to JPEG.")

        return encoded.tobytes()

detector_service = DetectorService()
