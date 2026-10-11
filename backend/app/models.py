import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    width = Column(Integer, nullable=False, default=0)
    height = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, index=True)  # "DEFECT_DETECTED", "NO_DEFECT_DETECTED", "FAILED"
    detection_count = Column(Integer, nullable=False, default=0)
    confidence_threshold = Column(Float, nullable=False, default=0.25)
    inference_time_ms = Column(Float, nullable=False, default=0.0)
    original_image_path = Column(String(500), nullable=False)
    annotated_image_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    # Relationships
    detections = relationship("Detection", back_populates="inspection", cascade="all, delete-orphan")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(Integer, nullable=False, default=0)
    class_name = Column(String(50), nullable=False, default="defect")
    confidence = Column(Float, nullable=False)
    x1 = Column(Float, nullable=False)
    y1 = Column(Float, nullable=False)
    x2 = Column(Float, nullable=False)
    y2 = Column(Float, nullable=False)

    inspection = relationship("Inspection", back_populates="detections")
