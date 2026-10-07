import sys
import os
import io

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("========================================")
    print("RailGuard Backend Independent Test Suite")
    print("========================================")

    # 1. Test Health Endpoint
    print("\n[Test 1] Testing GET /api/health...")
    health_resp = client.get("/api/health")
    print(f"Status Code: {health_resp.status_code}")
    print(f"Health Response: {health_resp.json()}")
    assert health_resp.status_code == 200
    assert health_resp.json()["model_loaded"] is True
    assert health_resp.json()["model"] == "YOLO11"
    print(">>> PASS: Health check verified!")

    # Locate sample test images
    repo_root = os.path.abspath(os.path.join(backend_dir, ".."))
    defect_img_path = os.path.join(repo_root, "test_images", "defect_track_sample.jpg")
    if not os.path.exists(defect_img_path):
        defect_img_path = os.path.join(
            repo_root, "Models", "YOLOv11", "results", "false_positives",
            "FP_03_20231018_112728_mp4-0042_jpg.rf.702ed1aa2759e00bd4be588cab600735.jpg"
        )
    no_defect_img_path = os.path.join(repo_root, "test_images", "clean_track_sample.jpg")
    if not os.path.exists(no_defect_img_path):
        no_defect_img_path = os.path.join(
            repo_root, "Models", "YOLOv11", "results", "false_negatives",
            "FN_06_20231018_112728_mp4-0106_jpg.rf.7748e8d5e975549523149d871a9e297e.jpg"
        )

    # 2. Test A: Defect Detection
    print("\n[Test 2 - Test A] Testing POST /api/detect with defect image...")
    assert os.path.exists(defect_img_path), f"Sample defect image not found: {defect_img_path}"
    with open(defect_img_path, "rb") as f:
        img_bytes = f.read()

    files = {"image": ("defect_sample.jpg", img_bytes, "image/jpeg")}
    detect_resp = client.post("/api/detect", files=files)
    print(f"Status Code: {detect_resp.status_code}")
    data = detect_resp.json()
    print(f"Success: {data['success']}")
    print(f"Result: {data['result']}")
    print(f"Defect Count: {data['defect_count']}")
    print(f"Highest Confidence: {data.get('highest_confidence')}")
    print(f"Inference Time: {data.get('inference_time_ms')} ms")
    print(f"Image ID: {data.get('image_id')}")
    print(f"Annotated Image URL: {data.get('annotated_image_url')}")
    if data["detections"]:
        print(f"First Detection: {data['detections'][0]}")

    assert detect_resp.status_code == 200
    assert data["success"] is True
    assert data["result"] == "DEFECT DETECTED"
    assert data["defect_count"] > 0
    assert len(data["detections"]) > 0
    assert data["detections"][0]["class_name"] == "defect"
    assert data["image_id"] is not None
    print(">>> PASS: Defect detection verified (Test A)!")

    # 3. Test Retrieving Annotated Image
    print("\n[Test 3] Testing GET /api/result/{image_id}...")
    image_id = data["image_id"]
    result_img_resp = client.get(f"/api/result/{image_id}")
    print(f"Status Code: {result_img_resp.status_code}")
    print(f"Content-Type: {result_img_resp.headers.get('content-type')}")
    print(f"Bytes received: {len(result_img_resp.content)}")
    assert result_img_resp.status_code == 200
    assert "image/jpeg" in result_img_resp.headers.get("content-type")
    assert len(result_img_resp.content) > 1000
    print(">>> PASS: Annotated image retrieval verified!")

    # 4. Test B: No Defect Detection
    print("\n[Test 4 - Test B] Testing POST /api/detect with clean/no-defect image...")
    assert os.path.exists(no_defect_img_path), f"Clean test image not found: {no_defect_img_path}"
    with open(no_defect_img_path, "rb") as f:
        clean_bytes = f.read()

    files = {"image": ("clean_sample.jpg", clean_bytes, "image/jpeg")}
    clean_resp = client.post("/api/detect", files=files, data={"confidence": "0.40"})
    print(f"Status Code: {clean_resp.status_code}")
    clean_data = clean_resp.json()
    print(f"Success: {clean_data['success']}")
    print(f"Result: {clean_data['result']}")
    print(f"Defect Count: {clean_data['defect_count']}")
    print(f"Detections: {clean_data['detections']}")

    assert clean_resp.status_code == 200
    assert clean_data["success"] is True
    assert clean_data["result"] == "NO DEFECT DETECTED"
    assert clean_data["defect_count"] == 0
    assert len(clean_data["detections"]) == 0
    print(">>> PASS: Zero defect detection verified (Test B)!")

    # 5. Test Error Handling (Invalid file format)
    print("\n[Test 5] Testing POST /api/detect with invalid text file...")
    fake_files = {"image": ("test.txt", b"This is not an image", "text/plain")}
    err_resp = client.post("/api/detect", files=fake_files)
    print(f"Status Code: {err_resp.status_code}")
    print(f"Error Detail: {err_resp.json()}")
    assert err_resp.status_code == 400
    print(">>> PASS: Invalid file rejection verified!")

    print("\n========================================")
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY! ✅")
    print("========================================")

if __name__ == "__main__":
    run_tests()
