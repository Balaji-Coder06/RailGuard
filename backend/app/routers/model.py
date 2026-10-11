from fastapi import APIRouter
from ..services.detector import detector_service
from ..schemas import ModelInfoResponse

router = APIRouter(prefix="/model", tags=["Model"])

@router.get("/info", response_model=ModelInfoResponse)
def get_model_information():
    """
    Returns verified YOLO11s model architecture, class mappings, and weights info.
    """
    info = detector_service.get_model_info()
    return ModelInfoResponse(**info)
