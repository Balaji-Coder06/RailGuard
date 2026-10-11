import os
import shutil
from pathlib import Path
from typing import Optional, Tuple
from ..config import settings

class StorageService:
    def __init__(self):
        self.storage_type = settings.STORAGE_TYPE
        self.original_dir = Path(settings.ORIGINAL_UPLOAD_DIR)
        self.annotated_dir = Path(settings.ANNOTATED_UPLOAD_DIR)
        
        self.original_dir.mkdir(parents=True, exist_ok=True)
        self.annotated_dir.mkdir(parents=True, exist_ok=True)

    def save_images(
        self, inspection_id: str, ext: str, original_bytes: bytes, annotated_bytes: bytes
    ) -> Tuple[str, str]:
        """
        Saves original and annotated images to persistent storage.
        Returns (original_file_path, annotated_file_path).
        """
        clean_ext = ext if ext.startswith(".") else f".{ext}"
        original_filename = f"{inspection_id}_orig{clean_ext}"
        annotated_filename = f"{inspection_id}_annotated.jpg"

        original_path = self.original_dir / original_filename
        annotated_path = self.annotated_dir / annotated_filename

        with open(original_path, "wb") as f:
            f.write(original_bytes)

        with open(annotated_path, "wb") as f:
            f.write(annotated_bytes)

        return str(original_path), str(annotated_path)

    def get_image_path(self, file_path_str: str) -> Optional[Path]:
        """
        Validates and returns existing Path or None.
        Guards against directory traversal.
        """
        path = Path(file_path_str).resolve()
        # Ensure path is within upload directory
        upload_root = Path(settings.UPLOAD_DIR).resolve()
        try:
            path.relative_to(upload_root)
        except ValueError:
            return None

        if path.is_file():
            return path
        return None

    def delete_images(self, original_path_str: str, annotated_path_str: str) -> None:
        """
        Deletes original and annotated images safely.
        """
        for p_str in (original_path_str, annotated_path_str):
            if p_str:
                p = self.get_image_path(p_str)
                if p and p.exists():
                    try:
                        p.unlink()
                    except OSError:
                        pass

storage_service = StorageService()
