from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..services.detector import detector_service
from ..config import settings
from ..schemas import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def check_health(db: Session = Depends(get_db)):
    """
    Checks backend health, model loading state, and database connectivity.
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        print(f"[Health] DB Check failed: {e}")
        db_ok = False

    return HealthResponse(
        status="healthy" if (detector_service.is_loaded and db_ok) else "degraded",
        model_loaded=detector_service.is_loaded,
        model_path=str(detector_service.model_path or settings.MODEL_PATH),
        database_connected=db_ok,
        storage_type=settings.STORAGE_TYPE,
        version=settings.VERSION,
    )
