from typing import List, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: float = Field(..., description="Top-left X coordinate in pixels")
    y1: float = Field(..., description="Top-left Y coordinate in pixels")
    x2: float = Field(..., description="Bottom-right X coordinate in pixels")
    y2: float = Field(..., description="Bottom-right Y coordinate in pixels")


class DetectionItem(BaseModel):
    class_id: int = Field(..., description="Integer class identifier (0-9)")
    class_name: str = Field(..., description="Class name from the trained model")
    confidence: float = Field(..., description="Detection confidence score (0.0 - 1.0)")
    box: BoundingBox = Field(..., description="Bounding box pixel coordinates")
    bbox: BoundingBox = Field(..., description="Bounding box pixel coordinates (alias)")


class DetectionResponse(BaseModel):
    success: bool = True
    result: str = Field(..., description="'DEFECT DETECTED' or 'NO DEFECT DETECTED'")
    has_defect: bool = Field(default=False, description="True if at least one defect detected")
    defect_count: int = Field(..., description="Number of detected defect objects")
    count: Optional[int] = Field(None, description="Number of detected defect objects (alias)")
    detections: List[DetectionItem] = Field(default_factory=list, description="List of detected defect objects")
    image_width: int = Field(..., description="Width of original processed image")
    image_height: int = Field(..., description="Height of original processed image")
    image_id: Optional[str] = Field(None, description="Identifier for retrieving annotated result image")
    annotated_image_url: Optional[str] = Field(None, description="URL endpoint to fetch the annotated image")
    highest_confidence: Optional[float] = Field(None, description="Highest detection confidence score")
    inference_time_ms: Optional[float] = Field(None, description="Model inference latency in milliseconds")


class HealthResponse(BaseModel):
    status: str = "ok"
    model: str = "YOLO11n"
    model_loaded: bool = True
    device: Optional[str] = "CPU"
    classes: Optional[List[str]] = None

