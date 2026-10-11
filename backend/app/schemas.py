from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class DetectionSchema(BaseModel):
    id: Optional[int] = None
    class_id: int
    class_name: str
    confidence: float
    confidence_percent: float
    bbox: List[float]  # [x1, y1, x2, y2]
    
    model_config = ConfigDict(from_attributes=True)

class InspectionResponse(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    width: int
    height: int
    status: str
    detection_count: int
    confidence_threshold: float
    inference_time_ms: float
    original_image_url: str
    annotated_image_url: str
    created_at: datetime
    detections: List[DetectionSchema] = []

    model_config = ConfigDict(from_attributes=True)

class InspectionListResponse(BaseModel):
    items: List[InspectionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class StatsResponse(BaseModel):
    total_inspections: int
    defects_detected_count: int
    clean_count: int
    defect_rate_percent: float
    average_inference_time_ms: float
    last_inspection_at: Optional[datetime] = None

class ModelInfoResponse(BaseModel):
    name: str
    task: str
    class_count: int
    class_names: Dict[int, str]
    verified_classes: List[str]
    weights_path: str
    weights_size_mb: float
    architecture: str
    input_resolution: int
    device: str
    framework_version: str
    torch_version: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: str
    database_connected: bool
    storage_type: str
    version: str

class MetricsResponse(BaseModel):
    map50: float
    map50_95: float
    precision: float
    recall: float
    is_reported_benchmark: bool
    evaluation_dataset: str
    dataset_class_count: int
    classes: List[str]
    note: str
    detailed_metrics: Dict[str, Any]
