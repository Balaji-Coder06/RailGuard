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
        self._supabase_client = None

        # Ensure local dirs always exist (used as fallback)
        self.original_dir.mkdir(parents=True, exist_ok=True)
        self.annotated_dir.mkdir(parents=True, exist_ok=True)

    def _get_supabase(self):
        """Lazily initialise Supabase client only when needed."""
        if self._supabase_client is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise RuntimeError(
                    "SUPABASE_URL and SUPABASE_KEY must be set when STORAGE_TYPE=supabase"
                )
            from supabase import create_client  # noqa: PLC0415
            self._supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return self._supabase_client

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def save_images(
        self, inspection_id: str, ext: str, original_bytes: bytes, annotated_bytes: bytes
    ) -> Tuple[str, str]:
        """
        Saves original and annotated images to storage.
        Returns (original_ref, annotated_ref) — file paths for local,
        Supabase object paths for remote.
        """
        if self.storage_type == "supabase":
            return self._save_supabase(inspection_id, ext, original_bytes, annotated_bytes)
        return self._save_local(inspection_id, ext, original_bytes, annotated_bytes)

    def get_image_bytes(self, ref: str) -> Optional[bytes]:
        """
        Returns raw image bytes for a given ref.
        Used by image-serving endpoints when STORAGE_TYPE=supabase
        (local storage still uses FileResponse via get_image_path).
        """
        if self.storage_type == "supabase":
            try:
                sb = self._get_supabase()
                response = sb.storage.from_(settings.SUPABASE_BUCKET).download(ref)
                return response
            except Exception:
                return None
        # Local: read from disk
        path = self.get_image_path(ref)
        if path:
            return path.read_bytes()
        return None

    def get_image_path(self, file_path_str: str) -> Optional[Path]:
        """
        Validates and returns an existing local Path or None.
        Guards against directory traversal.
        Only meaningful for local storage.
        """
        path = Path(file_path_str).resolve()
        upload_root = Path(settings.UPLOAD_DIR).resolve()
        try:
            path.relative_to(upload_root)
        except ValueError:
            return None
        if path.is_file():
            return path
        return None

    def delete_images(self, original_ref: str, annotated_ref: str) -> None:
        """Deletes original and annotated images safely."""
        if self.storage_type == "supabase":
            self._delete_supabase([original_ref, annotated_ref])
        else:
            for p_str in (original_ref, annotated_ref):
                if p_str:
                    p = self.get_image_path(p_str)
                    if p and p.exists():
                        try:
                            p.unlink()
                        except OSError:
                            pass

    def is_remote(self) -> bool:
        """True when using Supabase (images served via time-limited signed URL)."""
        return self.storage_type == "supabase"

    def get_signed_url(self, ref: str, expires_in: int = 3600) -> Optional[str]:
        """
        Returns a time-limited signed URL for a private Supabase Storage object.

        Args:
            ref:        The object path inside the bucket
                        (e.g. "original/uuid_orig.jpg").
            expires_in: Seconds until the URL expires (default 3600 = 1 hour).

        Returns:
            A signed URL string, or None if generation fails.
        """
        if self.storage_type != "supabase":
            return None
        try:
            sb = self._get_supabase()
            result = sb.storage.from_(settings.SUPABASE_BUCKET).create_signed_url(
                ref, expires_in
            )
            # supabase-py v2 returns a dict: {"signedURL": "...", ...}
            if isinstance(result, dict):
                return result.get("signedURL") or result.get("signed_url")
            # supabase-py may also return an object with a .signed_url attribute
            return getattr(result, "signed_url", None) or getattr(result, "signedURL", None)
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _save_local(
        self, inspection_id: str, ext: str, original_bytes: bytes, annotated_bytes: bytes
    ) -> Tuple[str, str]:
        clean_ext = ext if ext.startswith(".") else f".{ext}"
        original_path = self.original_dir / f"{inspection_id}_orig{clean_ext}"
        annotated_path = self.annotated_dir / f"{inspection_id}_annotated.jpg"

        with open(original_path, "wb") as f:
            f.write(original_bytes)
        with open(annotated_path, "wb") as f:
            f.write(annotated_bytes)

        return str(original_path), str(annotated_path)

    def _save_supabase(
        self, inspection_id: str, ext: str, original_bytes: bytes, annotated_bytes: bytes
    ) -> Tuple[str, str]:
        sb = self._get_supabase()
        bucket = settings.SUPABASE_BUCKET
        clean_ext = ext if ext.startswith(".") else f".{ext}"

        orig_key = f"original/{inspection_id}_orig{clean_ext}"
        annot_key = f"annotated/{inspection_id}_annotated.jpg"

        content_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
        }
        orig_ct = content_type_map.get(clean_ext.lower(), "image/jpeg")

        sb.storage.from_(bucket).upload(
            path=orig_key,
            file=original_bytes,
            file_options={"content-type": orig_ct, "upsert": "true"},
        )
        sb.storage.from_(bucket).upload(
            path=annot_key,
            file=annotated_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )

        return orig_key, annot_key

    def _delete_supabase(self, refs: list) -> None:
        valid = [r for r in refs if r]
        if not valid:
            return
        try:
            sb = self._get_supabase()
            sb.storage.from_(settings.SUPABASE_BUCKET).remove(valid)
        except Exception:
            pass


storage_service = StorageService()
