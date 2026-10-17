import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from schemas.response import DetectionResponse, HealthResponse
from services.detector import DefectDetector, DEFAULT_CONFIDENCE_THRESHOLD
from utils.image_utils import (
    validate_image_file,
    read_image_safely,
    draw_annotations,
    store_result_image,
    get_cached_result_image,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("railguard.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load YOLO11n model once into memory
    logger.info("Initializing RailGuard DefectDetector service...")
    try:
        DefectDetector.get_instance()
    except Exception as e:
        logger.error(f"Failed to initialize DefectDetector at startup: {e}")
        raise e
    yield
    # Shutdown
    logger.info("RailGuard backend shutting down.")


app = FastAPI(
    title="RailGuard AI Railway Track Defect Detection API",
    description="High-precision railway track fault detection backend powered by YOLO11n.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure specific CORS origins
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
if cors_origins_env:
    for origin in cors_origins_env.split(","):
        origin_clean = origin.strip()
        if origin_clean and origin_clean not in allowed_origins:
            allowed_origins.append(origin_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Backend and model readiness health check.
    """
    try:
        detector = DefectDetector.get_instance()
        device_label = "CUDA" if detector.device == "cuda" else "CPU"
        class_list = [detector.class_names[k] for k in sorted(detector.class_names.keys())]
        return HealthResponse(
            status="ok",
            model="YOLO11n",
            model_loaded=True,
            device=device_label,
            classes=class_list
        )
    except Exception as e:
        logger.error(f"Health check failure: {e}")
        return HealthResponse(
            status="error",
            model="YOLO11n",
            model_loaded=False,
            device="unknown",
            classes=[]
        )


@app.post("/api/detect", response_model=DetectionResponse)
async def detect_track_defect(
    image: UploadFile = File(..., description="Railway track image file"),
    confidence: Optional[float] = Form(None, description="Optional custom confidence threshold (0.01 - 1.0)")
):
    """
    Performs YOLO11n defect detection on an uploaded railway track image.
    Generates annotated image with defect bounding boxes.
    """
    if not image or not image.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file provided. Please upload a valid railway track image."
        )

    # Read image content
    try:
        file_bytes = await image.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded image bytes: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read the uploaded file data."
        )

    file_size = len(file_bytes)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    # Validate file extension, MIME type, and size
    is_valid, err_msg = validate_image_file(image.filename, image.content_type, file_size)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg or "Invalid image file format."
        )

    # Safe image parsing
    try:
        image_rgb, width, height = read_image_safely(file_bytes)
    except ValueError as e:
        logger.warning(f"Image decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to decode image. Please ensure the file is a valid image (.jpg, .jpeg, .png, .webp)."
        )

    # Parse confidence override if given
    conf_thresh = DEFAULT_CONFIDENCE_THRESHOLD
    if confidence is not None:
        if 0.01 <= confidence <= 1.0:
            conf_thresh = confidence
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Confidence threshold must be between 0.01 and 1.0."
            )

    # Run YOLO11n inference
    try:
        detector = DefectDetector.get_instance()
        detections, inference_time_ms = detector.predict(image_rgb, confidence_threshold=conf_thresh)
    except Exception as e:
        logger.error(f"Inference execution failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to analyze this image. An internal error occurred during model inference."
        )

    defect_count = len(detections)
    overall_result = "DEFECT DETECTED" if defect_count > 0 else "NO DEFECT DETECTED"
    has_defect = defect_count > 0
    highest_conf = detections[0]["confidence"] if defect_count > 0 else None

    # Generate annotated image
    try:
        annotated_rgb = draw_annotations(image_rgb, detections)
        image_id, _ = store_result_image(annotated_rgb, format="JPEG")
        annotated_image_url = f"/api/result/{image_id}"
    except Exception as e:
        logger.warning(f"Error annotating/storing image: {e}")
        image_id = None
        annotated_image_url = None

    return DetectionResponse(
        success=True,
        result=overall_result,
        has_defect=has_defect,
        defect_count=defect_count,
        count=defect_count,
        detections=detections,
        image_width=width,
        image_height=height,
        image_id=image_id,
        annotated_image_url=annotated_image_url,
        highest_confidence=highest_conf,
        inference_time_ms=inference_time_ms
    )


@app.get("/api/result/{image_id}")
async def get_annotated_image(image_id: str):
    """
    Fetches the processed and annotated railway track image by image_id.
    """
    cached = get_cached_result_image(image_id)
    if not cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotated result image not found or expired from cache."
        )

    return Response(
        content=cached["bytes"],
        media_type=cached["media_type"],
        headers={"Cache-Control": "public, max-age=3600"}
    )
