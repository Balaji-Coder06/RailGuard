import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "RailGuard"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI Railway Track Defect Detection API"
    API_PREFIX: str = "/api"
    
    # Model Configuration
    MODEL_PATH: str = str(BASE_DIR / "models" / "best.pt")
    DATA_YAML_PATH: str = str(ROOT_DIR / "data.yaml")
    
    # Database Configuration (SQLite default, PostgreSQL via DATABASE_URL)
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'railguard.db'}"
    
    # Storage Configuration
    STORAGE_TYPE: str = "local"  # "local", "supabase", etc.
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    ORIGINAL_UPLOAD_DIR: str = str(BASE_DIR / "uploads" / "original")
    ANNOTATED_UPLOAD_DIR: str = str(BASE_DIR / "uploads" / "annotated")
    
    # Supabase optional settings (for production)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "railguard-inspections"
    
    # Validation & Inference
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
    ALLOWED_MIME_TYPES: list[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/bmp",
    ]
    DEFAULT_CONF_THRESHOLD: float = 0.25
    
    # CORS
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Historical Benchmark Metrics (Reported test metrics)
    BENCHMARK_MAP50: float = 82.64
    BENCHMARK_MAP50_95: float = 38.31
    BENCHMARK_PRECISION: float = 86.66
    BENCHMARK_RECALL: float = 78.45
    
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure directories exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.ORIGINAL_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.ANNOTATED_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(BASE_DIR / "data").mkdir(parents=True, exist_ok=True)
