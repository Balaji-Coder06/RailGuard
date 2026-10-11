# RailGuard &mdash; AI Railway Inspection & Defect Intelligence

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Ultralytics](https://img.shields.io/badge/YOLO11s-Ultralytics_8.4-00FFFF.svg)](https://ultralytics.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.14_CPU-EE4C2C.svg?logo=pytorch)](https://pytorch.org)
[![React](https://img.shields.io/badge/React-19.2_TS-61DAFB.svg?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.3-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-CC_BY_4.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)

**RailGuard** is an industrial computer-vision inspection system designed for autonomous railway track defect identification. Powered by an Ultralytics **YOLO11s** object detection checkpoint (`best.pt`), the platform processes high-resolution surface rail imagery, pinpoints surface faults with pixel-level bounding boxes, logs audit histories to persistent storage, and renders interactive side-by-side and split-slider comparisons.

---

## 1. Verified Model & Dataset Specifications

Before writing code or serving inference, the supplied checkpoint and dataset files were strictly verified:

- **Supplied Checkpoint**: `best.pt` (18.3 MB) &mdash; YOLO11s Small architecture (`yolo11s.yaml`).
- **Framework Compatibility**: Verified with Ultralytics 8.4.173 and PyTorch 2.14.0+cpu.
- **Model Task**: `detect` (Bounding-box object detection).
- **Verified Class Mapping**:
  - Class ID `0` &rarr; `defect`
  - Total classes: `1`
- **Class Label Policy**: As specified by the training configuration, no arbitrary subclasses (e.g., cracks, corrosion, spalling) are fabricated. Detections are labeled with the verified generic class label **`DEFECT`**.
- **Reported Historical Test Benchmarks** (from test split evaluation):
  - **mAP@50**: 82.64%
  - **mAP@50–95**: 38.31%
  - **Precision**: 86.66%
  - **Recall**: 78.45%
  *(These are reported historical benchmark values from test evaluation, not recalculated on individual live uploads)*.

---

## 2. Key Architecture & Features

### Frontend (React 19 + TypeScript + Tailwind CSS)
1. **Overview Dashboard**: Real-time KPI cards (Total Inspections, Defects Found, Clean Rails, Avg Latency), active model telemetry, recent inspection audit log, and backend connectivity monitor.
2. **New Inspection**:
   - Drag-and-drop file upload with format/size validation (JPEG, PNG, WEBP, BMP up to 15MB).
   - Adjustable confidence threshold slider (default 0.25).
   - One-click sample rail track loader for instant testing.
   - Interactive comparison viewer: **Side-by-Side** mode and an **Interactive Split Comparison Slider** with draggable divider knob.
   - Verified detection table with confidence % and bounding box coordinates `[x1, y1, x2, y2]`.
   - Annotated image download and structured JSON export.
   - Prominent Safety & Compliance disclaimer.
3. **Inspection History**:
   - Filter by defect state (`DEFECT_DETECTED` vs `NO_DEFECT_DETECTED`).
   - Search by filename, sort by timestamp or detection count.
   - Switchable Table view and Grid card view.
   - Detailed inspection drawer modal with side-by-side view.
   - Delete action with confirmation modal and file cleanup.
4. **Model Performance**: Visualization of reported historical benchmarks, Precision-Recall tradeoff curve, single-class confusion matrix, and YOLO11s neural architecture breakdown.
5. **System Settings**: Live API ping with latency measurement, custom API Base URL configuration (`VITE_API_BASE_URL`), and zero-secret credential protection display.

### Backend (FastAPI + SQLAlchemy + Ultralytics)
- **Singleton Model Lifecycle**: Checkpoint `best.pt` loaded once during FastAPI `lifespan` startup, never per-request.
- **Data Persistence**: SQLite for local development (`railguard.db`), automatically ready for hosted PostgreSQL (Supabase).
- **Storage Service Abstraction**: Image upload and annotation handling with path traversal prevention and cascade file cleanup on deletion.
- **Industrial Image Annotation**: Clean electric lime bounding boxes (`#A3E635`), HUD corner brackets, and contrast label badges.

---

## 3. Quickstart & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Step 1: Clone & Start Backend

```bash
# Navigate to repository root
cd RailGuard

# Install Python dependencies
pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be active at:
- API Root: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

### Step 2: Start Frontend

In a second terminal window:

```bash
# Navigate to frontend folder
cd RailGuard/frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend will open at:
- Web App: `http://localhost:5173`

*(The Vite dev server automatically proxies `/api` requests to `http://127.0.0.1:8000`)*.

---

## 4. Running Automated Tests

### Backend Test Suite (PyTest)
The test suite covers model loading, health checks, model info verification, metrics validation, clean track detection, invalid uploads, inspection retrieval, and deletion:

```bash
# Run pytest from project root
python -m pytest backend/tests/test_api.py -v
```

### Frontend Typecheck & Production Build
```bash
cd frontend
npm run build
```

---

## 5. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and model health status |
| `GET` | `/api/model/info` | YOLO11s model architecture, verified classes, weights info |
| `POST` | `/api/detect` | Upload track image & run YOLO inference |
| `GET` | `/api/inspections` | Paginated, searchable inspection history |
| `GET` | `/api/inspections/stats` | Aggregated dashboard telemetry metrics |
| `GET` | `/api/inspections/{id}` | Single inspection detail with detection coordinates |
| `GET` | `/api/inspections/{id}/image/original` | Stream original input image |
| `GET` | `/api/inspections/{id}/image/annotated` | Stream AI-annotated output image |
| `DELETE` | `/api/inspections/{id}` | Delete inspection record & disk image files |
| `GET` | `/api/metrics` | Reported historical benchmark evaluation metrics |

---

## 6. Safety Disclaimer

> **IMPORTANT**: A negative model prediction does not establish that a railway track is structurally safe. Automated AI computer vision assists certified track inspectors and must not replace manual track safety audits and non-destructive ultrasonic testing.
