import uuid
import os
import mimetypes
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

from ..database import get_db
from ..models import Inspection, Detection
from ..schemas import (
    InspectionResponse,
    InspectionListResponse,
    StatsResponse,
    DetectionSchema,
)
from ..services.detector import detector_service
from ..services.storage import storage_service
from ..config import settings

router = APIRouter(tags=["Inspections"])

def inspection_to_response(insp: Inspection) -> InspectionResponse:
    return InspectionResponse(
        id=insp.id,
        filename=insp.filename,
        file_size_bytes=insp.file_size_bytes,
        width=insp.width,
        height=insp.height,
        status=insp.status,
        detection_count=insp.detection_count,
        confidence_threshold=insp.confidence_threshold,
        inference_time_ms=insp.inference_time_ms,
        original_image_url=f"/api/inspections/{insp.id}/image/original",
        annotated_image_url=f"/api/inspections/{insp.id}/image/annotated",
        created_at=insp.created_at,
        detections=[
            DetectionSchema(
                id=d.id,
                class_id=d.class_id,
                class_name=d.class_name,
                confidence=d.confidence,
                confidence_percent=round(d.confidence * 100, 2),
                bbox=[d.x1, d.y1, d.x2, d.y2],
            )
            for d in insp.detections
        ],
    )

@router.post("/detect", response_model=InspectionResponse)
async def detect_defects(
    file: UploadFile = File(...),
    confidence: float = Form(0.25),
    db: Session = Depends(get_db),
):
    """
    Upload an image and run actual YOLO11s defect detection inference.
    """
    # 1. Validate file extension
    original_filename = file.filename or "uploaded_image.jpg"
    ext = Path(original_filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Read bytes and validate size
    image_bytes = await file.read()
    file_size = len(image_bytes)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # 3. Validate confidence range
    conf_thresh = max(0.01, min(0.99, float(confidence)))

    # 4. Run real inference
    try:
        detections_data, inference_time_ms, annotated_bytes, width, height = detector_service.detect(
            image_bytes=image_bytes, conf_threshold=conf_thresh
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Image decoding error: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference pipeline error: {str(e)}")

    # 5. Determine inspection status
    det_count = len(detections_data)
    status_str = "DEFECT_DETECTED" if det_count > 0 else "NO_DEFECT_DETECTED"

    # 6. Save images to persistent storage
    inspection_id = str(uuid.uuid4())
    orig_path, annot_path = storage_service.save_images(
        inspection_id=inspection_id,
        ext=ext,
        original_bytes=image_bytes,
        annotated_bytes=annotated_bytes,
    )

    # 7. Persist to database
    inspection_record = Inspection(
        id=inspection_id,
        filename=Path(original_filename).name,
        file_size_bytes=file_size,
        width=width,
        height=height,
        status=status_str,
        detection_count=det_count,
        confidence_threshold=conf_thresh,
        inference_time_ms=inference_time_ms,
        original_image_path=orig_path,
        annotated_image_path=annot_path,
    )
    db.add(inspection_record)
    db.flush()

    # Add detection records
    for det in detections_data:
        det_record = Detection(
            inspection_id=inspection_id,
            class_id=det["class_id"],
            class_name=det["class_name"],
            confidence=det["confidence"],
            x1=det["bbox"][0],
            y1=det["bbox"][1],
            x2=det["bbox"][2],
            y2=det["bbox"][3],
        )
        db.add(det_record)

    db.commit()
    db.refresh(inspection_record)

    return inspection_to_response(inspection_record)

@router.get("/inspections/stats", response_model=StatsResponse)
def get_inspection_stats(db: Session = Depends(get_db)):
    """
    Returns actual aggregated inspection statistics from persisted records.
    """
    total = db.query(Inspection).count()
    if total == 0:
        return StatsResponse(
            total_inspections=0,
            defects_detected_count=0,
            clean_count=0,
            defect_rate_percent=0.0,
            average_inference_time_ms=0.0,
            last_inspection_at=None,
        )

    defects = db.query(Inspection).filter(Inspection.status == "DEFECT_DETECTED").count()
    clean = db.query(Inspection).filter(Inspection.status == "NO_DEFECT_DETECTED").count()
    avg_latency = db.query(func.avg(Inspection.inference_time_ms)).scalar() or 0.0
    last_record = db.query(Inspection).order_by(desc(Inspection.created_at)).first()

    defect_rate = round((defects / total) * 100, 2)

    return StatsResponse(
        total_inspections=total,
        defects_detected_count=defects,
        clean_count=clean,
        defect_rate_percent=defect_rate,
        average_inference_time_ms=round(float(avg_latency), 2),
        last_inspection_at=last_record.created_at if last_record else None,
    )

@router.get("/inspections", response_model=InspectionListResponse)
def list_inspections(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("date_desc"),
    db: Session = Depends(get_db),
):
    """
    Returns paginated, searchable, and filtered inspection history.
    """
    query = db.query(Inspection)

    if status and status.upper() in ["DEFECT_DETECTED", "NO_DEFECT_DETECTED"]:
        query = query.filter(Inspection.status == status.upper())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Inspection.filename.ilike(term))

    if sort_by == "date_asc":
        query = query.order_by(asc(Inspection.created_at))
    elif sort_by == "count_desc":
        query = query.order_by(desc(Inspection.detection_count), desc(Inspection.created_at))
    elif sort_by == "count_asc":
        query = query.order_by(asc(Inspection.detection_count), desc(Inspection.created_at))
    else:  # date_desc default
        query = query.order_by(desc(Inspection.created_at))

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return InspectionListResponse(
        items=[inspection_to_response(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

@router.get("/inspections/{id}", response_model=InspectionResponse)
def get_inspection_detail(id: str, db: Session = Depends(get_db)):
    """
    Returns full details of an inspection including detection boxes.
    """
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")
    return inspection_to_response(inspection)

@router.get("/inspections/{id}/image/original")
def get_original_image(id: str, db: Session = Depends(get_db)):
    """
    Streams original inspection image.
    """
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    img_path = storage_service.get_image_path(inspection.original_image_path)
    if not img_path:
        raise HTTPException(status_code=404, detail="Original image file not found on disk.")

    media_type, _ = mimetypes.guess_type(str(img_path))
    return FileResponse(img_path, media_type=media_type or "image/jpeg")

@router.get("/inspections/{id}/image/annotated")
def get_annotated_image(id: str, db: Session = Depends(get_db)):
    """
    Streams annotated inspection image.
    """
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    img_path = storage_service.get_image_path(inspection.annotated_image_path)
    if not img_path:
        raise HTTPException(status_code=404, detail="Annotated image file not found on disk.")

    return FileResponse(img_path, media_type="image/jpeg")

@router.delete("/inspections/{id}")
def delete_inspection(id: str, db: Session = Depends(get_db)):
    """
    Deletes an inspection record, detections, and stored image files.
    """
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    # Delete disk files safely
    storage_service.delete_images(
        inspection.original_image_path, inspection.annotated_image_path
    )

    db.delete(inspection)
    db.commit()

    return {"message": "Inspection record deleted successfully.", "id": id}
