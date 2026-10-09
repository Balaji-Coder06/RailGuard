import io
import time
import uuid
import os
from typing import Tuple, List, Dict, Any, Optional
from PIL import Image, ImageOps
import cv2
import numpy as np

# Allowed image extensions and max upload size (20 MB)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024  # 20 Megabytes

# In-memory storage for annotated result images with timestamp
# Format: image_id -> {"bytes": bytes, "media_type": str, "timestamp": float}
_RESULT_IMAGE_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour
MAX_CACHE_ENTRIES = 150


def validate_image_file(filename: str, content_type: Optional[str], size: int) -> Tuple[bool, Optional[str]]:
    """
    Validates uploaded file against extension, MIME type, and size limit.
    """
    if size > MAX_IMAGE_SIZE_BYTES:
        return False, f"File size exceeds maximum allowed limit of {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)}MB."

    ext = os.path.splitext(filename)[1].lower() if filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}."

    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES and not content_type.startswith("image/"):
        return False, f"Invalid MIME type '{content_type}'. Must be a valid image format."

    return True, None


def read_image_safely(image_bytes: bytes) -> Tuple[np.ndarray, int, int]:
    """
    Safely parses raw bytes into an RGB numpy image array, handling EXIF orientation.
    Returns: (rgb_numpy_array, width, height)
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img = ImageOps.exif_transpose(pil_img)
        pil_img = pil_img.convert("RGB")
        width, height = pil_img.size
        np_img = np.array(pil_img)
        return np_img, width, height
    except Exception as e:
        raise ValueError(f"Unable to safely decode image file: {str(e)}")


def draw_annotations(
    image_rgb: np.ndarray,
    detections: List[Dict[str, Any]],
    box_color: Tuple[int, int, int] = (239, 68, 68),  # Coral Red for defects (RGB)
    text_color: Tuple[int, int, int] = (255, 255, 255)
) -> np.ndarray:
    """
    Draws modern, high-precision technical bounding boxes and badges on the RGB image.
    Uses OpenCV for crisp rendering.
    """
    # Convert RGB to BGR for OpenCV drawing
    bgr_img = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    img_h, img_w = bgr_img.shape[:2]

    # Convert RGB box_color to BGR
    bgr_box_color = (box_color[2], box_color[1], box_color[0])

    # Dynamic line scaling based on image resolution
    scale_factor = max(img_w, img_h) / 1000.0
    line_thickness = max(2, int(round(2.5 * scale_factor)))
    corner_len = max(10, int(round(16 * scale_factor)))
    font_scale = max(0.45, 0.55 * scale_factor)
    font_thickness = max(1, int(round(1.5 * scale_factor)))

    for det in detections:
        box = det.get("bbox") or det.get("box", {})
        x1 = max(0, min(img_w - 1, int(round(box["x1"]))))
        y1 = max(0, min(img_h - 1, int(round(box["y1"]))))
        x2 = max(0, min(img_w - 1, int(round(box["x2"]))))
        y2 = max(0, min(img_h - 1, int(round(box["y2"]))))

        cls_name = str(det.get("class_name", "defect")).upper()
        if cls_name.startswith("CLASS"):
            cls_name = "DEFECT"
        conf = float(det.get("confidence", 0.0))
        label_text = f"{cls_name} {conf:.2f}"

        # 1. Main bounding box (subtle translucent fill inside box)
        overlay = bgr_img.copy()
        cv2.rectangle(overlay, (x1, y1), (x2, y2), bgr_box_color, -1)
        cv2.addWeighted(overlay, 0.12, bgr_img, 0.88, 0, bgr_img)

        # 2. Outer bounding box stroke
        cv2.rectangle(bgr_img, (x1, y1), (x2, y2), bgr_box_color, line_thickness)

        # 3. Corner reticle accents for modern engineering look
        c_len = min(corner_len, (x2 - x1) // 3, (y2 - y1) // 3)
        if c_len > 3:
            thick_accent = line_thickness + 2
            # Top-left
            cv2.line(bgr_img, (x1, y1), (x1 + c_len, y1), bgr_box_color, thick_accent)
            cv2.line(bgr_img, (x1, y1), (x1, y1 + c_len), bgr_box_color, thick_accent)
            # Top-right
            cv2.line(bgr_img, (x2, y1), (x2 - c_len, y1), bgr_box_color, thick_accent)
            cv2.line(bgr_img, (x2, y1), (x2, y1 + c_len), bgr_box_color, thick_accent)
            # Bottom-left
            cv2.line(bgr_img, (x1, y2), (x1 + c_len, y2), bgr_box_color, thick_accent)
            cv2.line(bgr_img, (x1, y2), (x1, y2 - c_len), bgr_box_color, thick_accent)
            # Bottom-right
            cv2.line(bgr_img, (x2, y2), (x2 - c_len, y2), bgr_box_color, thick_accent)
            cv2.line(bgr_img, (x2, y2), (x2, y2 - c_len), bgr_box_color, thick_accent)

        # 4. Label pill badge
        font = cv2.FONT_HERSHEY_SIMPLEX
        (text_w, text_h), baseline = cv2.getTextSize(label_text, font, font_scale, font_thickness)
        pad = int(4 * scale_factor) + 2
        
        # Decide if label goes above or inside the top of the box
        label_y2 = y1 if y1 - text_h - 2 * pad > 0 else min(img_h, y1 + text_h + 2 * pad)
        label_y1 = label_y2 - text_h - 2 * pad if y1 - text_h - 2 * pad > 0 else y1

        badge_x2 = min(img_w, x1 + text_w + 2 * pad)
        
        # Background dark pill with colored border
        cv2.rectangle(bgr_img, (x1, label_y1), (badge_x2, label_y2), (18, 18, 22), -1)
        cv2.rectangle(bgr_img, (x1, label_y1), (badge_x2, label_y2), bgr_box_color, 1)

        # Label text
        text_origin = (x1 + pad, label_y2 - pad - baseline // 2)
        cv2.putText(bgr_img, label_text, text_origin, font, font_scale, (255, 255, 255), font_thickness, cv2.LINE_AA)

    # Convert back to RGB
    return cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)


def store_result_image(image_rgb: np.ndarray, format: str = "JPEG") -> Tuple[str, bytes]:
    """
    Encodes RGB image to JPEG/PNG bytes and stores it in cache with automatic eviction.
    Returns: (image_id, image_bytes)
    """
    cleanup_cache()

    image_id = str(uuid.uuid4())
    pil_img = Image.fromarray(image_rgb)
    buf = io.BytesIO()
    
    if format.upper() == "PNG":
        pil_img.save(buf, format="PNG", optimize=True)
        media_type = "image/png"
    else:
        pil_img.save(buf, format="JPEG", quality=92, optimize=True)
        media_type = "image/jpeg"

    img_bytes = buf.getvalue()

    _RESULT_IMAGE_CACHE[image_id] = {
        "bytes": img_bytes,
        "media_type": media_type,
        "timestamp": time.time()
    }

    return image_id, img_bytes


def get_cached_result_image(image_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves cached annotated image by image_id.
    """
    return _RESULT_IMAGE_CACHE.get(image_id)


def cleanup_cache():
    """
    Cleans up old cache entries exceeding TTL or capacity.
    """
    now = time.time()
    expired = [k for k, v in _RESULT_IMAGE_CACHE.items() if now - v["timestamp"] > CACHE_TTL_SECONDS]
    for k in expired:
        _RESULT_IMAGE_CACHE.pop(k, None)

    # Evict oldest if exceeding capacity
    if len(_RESULT_IMAGE_CACHE) > MAX_CACHE_ENTRIES:
        sorted_keys = sorted(_RESULT_IMAGE_CACHE.keys(), key=lambda k: _RESULT_IMAGE_CACHE[k]["timestamp"])
        num_to_remove = len(_RESULT_IMAGE_CACHE) - MAX_CACHE_ENTRIES
        for k in sorted_keys[:num_to_remove]:
            _RESULT_IMAGE_CACHE.pop(k, None)
