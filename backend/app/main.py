import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import engine, Base
from . import models  # noqa: F401 — ensures all ORM models are registered on Base.metadata before create_all()
from .services.detector import detector_service
from .routers import health, model, inspections, metrics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    print(f"[{settings.PROJECT_NAME}] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    print(f"[{settings.PROJECT_NAME}] Pre-loading YOLO11s checkpoint from: {settings.MODEL_PATH}")
    try:
        detector_service.load_model()
        print(f"[{settings.PROJECT_NAME}] YOLO11s model ready for inference.")
    except Exception as e:
        print(f"[{settings.PROJECT_NAME}] CRITICAL: Failed to load YOLO11s model: {e}")
    
    yield
    # --- Shutdown ---
    print(f"[{settings.PROJECT_NAME}] Shutting down service.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to sanitize errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Unhandled Error] {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the request."},
    )

# Include Routers
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(model.router, prefix=settings.API_PREFIX)
app.include_router(inspections.router, prefix=settings.API_PREFIX)
app.include_router(metrics.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "tagline": "AI Railway Track Defect Detection",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health",
    }
