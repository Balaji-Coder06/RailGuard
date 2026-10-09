# RailGuard

AI-based railway track defect detection using lightweight YOLO nano models, with a FastAPI + React web app serving YOLO11n.

> **Status:** Active research. Phase 1 (single-class `defect` baseline) is done. Multi-class detection, severity assessment, and FPGA deployment are still in progress.

## Results (held-out test set, 1,494 defect instances)

| Model | Precision | Recall | F1 | mAP@50 | mAP@50-95 |
|---|---:|---:|---:|---:|---:|
| **YOLO11n** | **0.477** | 0.406 | **0.439** | **0.400** | **0.144** |
| YOLOv8n | 0.432 | **0.426** | 0.429 | 0.398 | 0.137 |
| YOLO26n | 0.434 | 0.376 | 0.403 | 0.375 | 0.136 |

Trained for 50 epochs at 640×640 on a Tesla T4. Per-model logs, confusion matrices, and error analysis are in `Models/`.

## Dataset

[Railway Track Surface Faults Dataset v2](https://data.mendeley.com/datasets/8hxtgyyxrw/2) (Mendeley, CC BY 4.0). All classes were collapsed to a single `defect` class for the Phase 1 baseline.

## Quickstart

**Inference**
```python
from ultralytics import YOLO

model = YOLO("Models/YOLOv11/YOLO11_railway_defect_best.pt")
model.predict("path/to/image.jpg", imgsz=640, conf=0.25, save=True)
```

**Web app**
```bash
# Backend (http://localhost:8000)
cd backend && pip install -r requirements.txt
python -m uvicorn main:app --reload

# Frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```
Place the model weights at `backend/models/best.pt`.

## Roadmap

- [x] Image-upload dashboard + REST API
- [ ] Multi-class defect detection (10 classes)
- [ ] Transformer-based detectors (RT-DETR / RF-DETR)
- [ ] FPGA / edge deployment
- [ ] Defect severity assessment
- [ ] Live video inspection

## Author

[@Balaji-Coder06](https://github.com/Balaji-Coder06)
