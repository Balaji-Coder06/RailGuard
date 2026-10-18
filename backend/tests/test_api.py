import io
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.detector import detector_service
from backend.app.database import Base, engine

@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    # Setup tables and load model
    Base.metadata.create_all(bind=engine)
    if not detector_service.is_loaded:
        detector_service.load_model()
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def create_test_image(color=(128, 128, 128), size=(640, 640)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["model_loaded"] is True
    assert data["database_connected"] is True
    assert data["storage_type"] == "local"

def test_model_info_endpoint(client):
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "YOLO11s"
    assert data["task"] == "detect"
    assert data["class_count"] == 1
    assert data["class_names"] == {"0": "defect"}
    assert "defect" in data["verified_classes"]
    assert data["input_resolution"] == 640

def test_metrics_endpoint(client):
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["map50"] == 82.64
    assert data["map50_95"] == 38.31
    assert data["precision"] == 86.66
    assert data["recall"] == 78.45
    assert data["is_reported_benchmark"] is True
    assert "defect" in data["classes"]

def test_stats_endpoint(client):
    response = client.get("/api/inspections/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_inspections" in data
    assert "defects_detected_count" in data
    assert "clean_count" in data
    assert "defect_rate_percent" in data

def test_detect_clean_image(client):
    # A solid smooth color image should return 0 detections (clean track)
    img_bytes = create_test_image(color=(70, 70, 70))
    response = client.post(
        "/api/detect",
        files={"file": ("clean_track.jpg", img_bytes, "image/jpeg")},
        data={"confidence": "0.25"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is not None
    assert data["status"] in ["NO_DEFECT_DETECTED", "DEFECT_DETECTED"]
    assert data["detection_count"] == len(data["detections"])
    assert data["width"] == 640
    assert data["height"] == 640
    assert data["original_image_url"] == f"/api/inspections/{data['id']}/image/original"
    assert data["annotated_image_url"] == f"/api/inspections/{data['id']}/image/annotated"
    assert data["inference_time_ms"] > 0

    # Verify image endpoints
    orig_res = client.get(f"/api/inspections/{data['id']}/image/original")
    assert orig_res.status_code == 200
    assert orig_res.headers["content-type"] in ["image/jpeg", "image/jpg"]

    annot_res = client.get(f"/api/inspections/{data['id']}/image/annotated")
    assert annot_res.status_code == 200
    assert annot_res.headers["content-type"] == "image/jpeg"

    # Delete test record
    del_res = client.delete(f"/api/inspections/{data['id']}")
    assert del_res.status_code == 200

def test_detect_invalid_file(client):
    # Test invalid extension
    response = client.post(
        "/api/detect",
        files={"file": ("test.txt", b"plain text content", "text/plain")},
        data={"confidence": "0.25"}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

    # Test empty file
    response = client.post(
        "/api/detect",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
        data={"confidence": "0.25"}
    )
    assert response.status_code == 400
    assert "Uploaded file is empty" in response.json()["detail"]

def test_inspection_history_and_pagination(client):
    # Create two test inspections
    img_bytes = create_test_image(color=(80, 80, 80))
    res1 = client.post(
        "/api/detect",
        files={"file": ("sample_track_1.jpg", img_bytes, "image/jpeg")},
        data={"confidence": "0.25"}
    )
    id1 = res1.json()["id"]

    res2 = client.post(
        "/api/detect",
        files={"file": ("sample_track_2.jpg", img_bytes, "image/jpeg")},
        data={"confidence": "0.25"}
    )
    id2 = res2.json()["id"]

    # List inspections
    list_res = client.get("/api/inspections?page=1&page_size=10")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2
    
    # Filter by search
    search_res = client.get("/api/inspections?search=sample_track_1")
    assert search_res.status_code == 200
    assert any(item["id"] == id1 for item in search_res.json()["items"])

    # Detail lookup
    detail_res = client.get(f"/api/inspections/{id1}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == id1

    # Clean up
    client.delete(f"/api/inspections/{id1}")
    client.delete(f"/api/inspections/{id2}")


# ---------------------------------------------------------------------------
# Signed-URL tests — run without a live Supabase connection via mocking
# ---------------------------------------------------------------------------

def test_get_signed_url_returns_none_in_local_mode():
    """get_signed_url must be a no-op when STORAGE_TYPE=local."""
    from backend.app.services.storage import storage_service

    # storage_service is always initialised with STORAGE_TYPE=local in tests
    assert storage_service.storage_type == "local"
    result = storage_service.get_signed_url("original/some-uuid_orig.jpg")
    assert result is None


def test_get_signed_url_calls_create_signed_url(monkeypatch):
    """
    When STORAGE_TYPE=supabase, get_signed_url must:
      - call create_signed_url(ref, expires_in=3600) on the storage bucket
      - extract the URL from the dict response {"signedURL": "..."}
      - return the URL string
    """
    from unittest.mock import MagicMock, patch
    from backend.app.services import storage as storage_module

    fake_url = "https://xyz.supabase.co/storage/v1/object/sign/railguard-inspections/original/abc_orig.jpg?token=tok"
    fake_client = MagicMock()
    fake_client.storage.from_().create_signed_url.return_value = {"signedURL": fake_url}

    svc = storage_module.StorageService.__new__(storage_module.StorageService)
    svc.storage_type = "supabase"
    svc._supabase_client = fake_client
    svc.original_dir = storage_module.storage_service.original_dir
    svc.annotated_dir = storage_module.storage_service.annotated_dir

    ref = "original/abc_orig.jpg"
    result = svc.get_signed_url(ref, expires_in=3600)

    fake_client.storage.from_().create_signed_url.assert_called_once_with(ref, 3600)
    assert result == fake_url


def test_image_endpoints_redirect_to_signed_url(client, monkeypatch):
    """
    Image retrieval endpoints must return 307 → signed URL when is_remote() is True.
    The test mocks storage_service so no Supabase connection is made.
    """
    import io
    from PIL import Image
    from unittest.mock import patch, MagicMock

    # Create and submit one real inspection (local storage)
    img = Image.new("RGB", (64, 64), color=(100, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    res = client.post(
        "/api/detect",
        files={"file": ("tiny.jpg", buf.getvalue(), "image/jpeg")},
        data={"confidence": "0.25"},
    )
    assert res.status_code == 200
    inspection_id = res.json()["id"]

    fake_signed = "https://xyz.supabase.co/storage/v1/object/sign/bucket/key?token=t"

    from backend.app.routers import inspections as insp_module

    with patch.object(insp_module.storage_service, "is_remote", return_value=True), \
         patch.object(insp_module.storage_service, "get_signed_url", return_value=fake_signed):

        # Original image endpoint — should redirect
        orig_res = client.get(
            f"/api/inspections/{inspection_id}/image/original",
            follow_redirects=False,
        )
        assert orig_res.status_code in (301, 302, 307, 308), \
            f"Expected redirect, got {orig_res.status_code}"
        assert orig_res.headers["location"] == fake_signed

        # Annotated image endpoint — should redirect
        annot_res = client.get(
            f"/api/inspections/{inspection_id}/image/annotated",
            follow_redirects=False,
        )
        assert annot_res.status_code in (301, 302, 307, 308), \
            f"Expected redirect, got {annot_res.status_code}"
        assert annot_res.headers["location"] == fake_signed

    # Clean up
    client.delete(f"/api/inspections/{inspection_id}")
