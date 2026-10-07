from typing import List, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: float = Field(..., description="Top-left X coordinate in pixels")
    y1: float = Field(..., description="Top-left Y coordinate in pixels")
    x2: float = Field(..., description="Bottom-right X coordinate in pixels")
    y2: float = Field(..., description="Bottom-right Y coordinate in pixels")


class DetectionItem(BaseModel):
    class_id: int = Field(..., description="Integer class identifier")
    class_name: str = Field(..., description="Class name from the trained model")
    confidence: float = Field(..., description="Detection confidence score between 0.0 and 1.0")
    box: BoundingBox = Field(..., description="Bounding box pixel coordinates")


class DetectionResponse(BaseModel):
    success: bool = True
    result: str = Field(..., description="'DEFECT DETECTED' or 'NO DEFECT DETECTED'")
    defect_count: int = Field(..., description="Number of detected defect objects")
    detections: List[DetectionItem] = Field(default_factory=list, description="List of detected defect objects")
    image_width: int = Field(..., description="Width of original processed image")
    image_height: int = Field(..., description="Height of original processed image")
    image_id: Optional[str] = Field(None, description="Identifier for retrieving annotated result image")
    annotated_image_url: Optional[str] = Field(None, description="URL endpoint to fetch the annotated image")
    highest_confidence: Optional[float] = Field(None, description="Highest detection confidence percentage or ratio")
    inference_time_ms: Optional[float] = Field(None, description="Model inference latency in milliseconds")


class HealthResponse(BaseModel):
    status: str = "ok"
    model: str = "YOLO11"
    model_loaded: bool = True
    device: Optional[str] = "CPU"
    classes: Optional[List[str]] = None
