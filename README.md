# RailGuard

**AI-Based Railway Track Fault Detection, Localization, Severity Assessment and Real-Time Monitoring System**

![Python](https://img.shields.io/badge/Python-3.13-blue.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.11-ee4c2c.svg)
![Ultralytics](https://img.shields.io/badge/Ultralytics-YOLO-00FFFF.svg)
![Status](https://img.shields.io/badge/Status-Active%20Research-orange.svg)
![License](https://img.shields.io/badge/License-AGPL--3.0-green.svg)

RailGuard is an empirical research project focused on deep learning-based object detection for railway track defects. It investigates and benchmarks lightweight nano object detectors—specifically **YOLO11n**, **YOLOv8n**, and **YOLO26n**—for binary defect identification and bounding-box localization on railway track surface imagery.

> **Scope & Capabilities Note:** The trained models currently implemented in this repository operate as **binary object detectors** (detecting whether a track defect is present and localizing it with a bounding box under class `defect`). They do not classify specific defect sub-types (e.g., distinguishing cracks vs. flakings), produce GPS coordinates, or compute automated severity metrics. Advanced features like FPGA deployment, multi-class categorization, and automated severity assessment represent active research goals supported by literature in the reference papers, but are not yet implemented in code.

---

## Table of Contents

- [Overview](#overview)
- [Dataset](#dataset)
- [Repository Structure](#repository-structure)
- [Experimental Results](#experimental-results)
  - [Held-Out Test Set Performance](#held-out-test-set-performance)
  - [Error Analysis (Fixed Threshold)](#error-analysis-fixed-threshold)
  - [Training Hyperparameters](#training-hyperparameters)
- [Installation](#installation)
- [Usage](#usage)
  - [Python Inference](#python-inference)
  - [Ultralytics CLI Inference](#ultralytics-cli-inference)
  - [Running the Notebooks](#running-the-notebooks)
- [Roadmap](#roadmap)
- [Author](#author)
- [Acknowledgements & Dataset Credits](#acknowledgements--dataset-credits)

---

## Overview

Railway track inspection requires fast, lightweight models capable of running in resource-constrained edge environments. RailGuard explores the performance, precision-recall trade-offs, and failure modes of state-of-the-art YOLO nano models trained on real railway track surface defect imagery.

Key elements verified in this repository:
- **Trained Model Checkpoints:** Saved weights for **YOLO11n** (`YOLO11_railway_defect_best.pt`), **YOLOv8n** (`YOLOv8_railway_defect_best.pt`), and **YOLO26n** (`YOLO26_railway_defect_best.pt`).
- **Complete Experiment Records:** Per-epoch training logs, evaluation metrics, confusion matrices, and precision/recall curves for each architecture.
- **Error Analysis & Failure Mode Auditing:** Detailed object-level false-positive and false-negative analysis on held-out test data.
- **Comparative Analysis Notebook:** A centralized cross-model comparison (`Model Dataset/comparison.ipynb`) evaluating validation, test, and error profiles.
- **Academic Research References:** A curated set of 8 research papers in `reference research papers/` covering FPGA edge acceleration, binary neural networks (BNN), and optical track inspection.

---

## Dataset

### Source & Provenance

The primary dataset used for training and evaluation is the **Railway Track Surface Faults Dataset (Version 2)**:
- **Platform:** Mendeley Data (Published January 2022)
- **DOI:** [10.17632/8hxtgyyxrw.2](https://data.mendeley.com/datasets/8hxtgyyxrw/2)
- **Contributors:** Asfar Arain, Sanaullah Mehran, Muhammad Zakir Shaikh, Dileep Kumar, Tanweer Hussain, and Bhawani Shankar Chowdhry (Mehran University of Engineering and Technology, Pakistan)
- **Data Article:** [PMC10828558](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10828558/)
- **Acquisition:** Video recorded at 120 FPS by two EKEN-H9R cameras mounted on an inspection vehicle at Kotri Junction, Pakistan Railway.

Additional reference dataset links tracked in `datasets.txt`:
- [Roboflow: rail-surface-defects-vc32s](https://universe.roboflow.com/ai-model-q3kj4/rail-surface-defects-vc32s)
- [Roboflow: rail-surface](https://universe.roboflow.com/yolov8-7zf1l/rail-surface)

### Annotation & Binary Conversion

The raw Mendeley dataset contains multi-class labels covering defects such as Grooves, Joints, Cracks, Flakings, Shellings, Spallings, and Squats across class IDs `0`–`9`. 

In the experimental pipeline documented in `model.ipynb`:
1. All original class IDs were collapsed to a single class: **`0: defect`**.
2. Normalized bounding-box coordinates (`x_center`, `y_center`, `width`, `height`) were preserved without alteration.
3. Images without defect annotations serve as negative background samples.
4. No synthetic images or synthetic annotations were generated.

### Dataset Splits & Counts

The experiments were executed on pre-split YOLO-format data (`rail defects detection.v18i.yolov8`). The splits and object counts verified from the training notebooks and logs are:

| Split | Images (YOLOv8 & YOLO11) | Images (YOLO26 Cleaned) | Ground-Truth Defect Instances |
|---|---:|---:|---:|
| **Train** | 6,781 | 6,681 | ~31,000+ |
| **Validation** | 606 | 606 | 2,838 |
| **Test (Held-Out)** | 310 | 300 | 1,494 |
| **Total** | **7,697** | **7,587** | **35,549** |

*Note on Splits:*
- For YOLOv8 and YOLO11, the 310 test images include 297 images with labels and 13 background images (0 objects).
- For YOLO26, orphan labels and 10 object-free images were pruned, yielding 300 test images containing the exact same 1,494 ground-truth defect annotations.
- The raw training images are hosted remotely (Mendeley / Kaggle). Locally within this repository, held-out test predictions (310 images and 273 label files for YOLOv8) and 10 representative predictions + 20 error analysis examples (10 FP, 10 FN) per model are stored in `Model Dataset/<model>/results/`.

---

## Repository Structure

The layout below reflects the exact directory tree and verified files in this repository:

```
RailGuard/
├── datasets.txt                                # Source URLs for base & auxiliary datasets
├── README.md                                   # Repository documentation (this file)
├── reference research papers/                  # 8 academic papers on railway inspection & edge AI
│   ├── 4323-Document Upload-17510-1-10-20250926.pdf
│   ├── An_Edge_AI_System_Based_on_FPGA_Platform_for_Railway_Fault_Detection.pdf
│   ├── An_Efficient_FPGA-Based_Edge_AI_System_for_Railway_Fault_Detection.pdf
│   ├── PCBNN_ An Algorithm–Hardware Co-Designed Binary Neural Network for Low-Power Edge Inference.pdf
│   ├── s40534-025-00423-2.pdf
│   ├── s40534-026-00434-7.pdf
│   ├── s44163-026-01298-w.pdf
│   └── sensors-26-00906.pdf
└── Model Dataset/
    ├── comparison.ipynb                        # Cross-model evaluation & chart comparison
    ├── YOLOv8/
    │   ├── README.md                           # Detailed YOLOv8 experiment documentation
    │   ├── YOLOv8_railway_defect_best.pt       # Trained weights (5.96 MiB)
    │   ├── model.ipynb                         # Dataset conversion & training notebook
    │   ├── testing.ipynb                       # Testing & error-analysis notebook
    │   ├── training_log.csv                    # Per-epoch loss & validation metrics
    │   ├── evaluation_log.csv                  # Test-set metrics & object counts
    │   └── results/
    │       ├── results.csv                     # Raw Ultralytics training log (50 epochs)
    │       ├── results.png                     # Training and validation loss/metric curves
    │       ├── error_analysis.csv              # Per-image TP / FP / FN counts
    │       ├── confusion_matrix.png            # Validation confusion matrix
    │       ├── confusion_matrix_normalized.png # Normalized validation confusion matrix
    │       ├── BoxP_curve.png, BoxR_curve.png  # Precision & Recall curves
    │       ├── BoxF1_curve.png, BoxPR_curve.png# F1 & PR curves
    │       ├── predictions/                    # 310 test prediction images + labels/ (273 .txt)
    │       ├── false_positives/                # 10 sample images with highest false positives
    │       └── false_negatives/                # 10 sample images with highest false negatives
    ├── YOLOv11/
    │   ├── README.md                           # Detailed YOLO11 experiment documentation
    │   ├── YOLO11_railway_defect_best.pt       # Trained weights (5.22 MiB)
    │   ├── model.ipynb                         # Dataset conversion & training notebook
    │   ├── testing.ipynb                       # Testing & prediction notebook
    │   ├── training_log.csv                    # Per-epoch loss & validation metrics
    │   ├── evaluation_log.csv                  # Validation & test metrics summary
    │   └── results/
    │       ├── results.csv                     # Raw Ultralytics training log (50 epochs)
    │       ├── results.png                     # Training and validation loss/metric curves
    │       ├── error_analysis.csv              # Per-image TP / FP / FN counts
    │       ├── confusion_matrix.png            # Validation confusion matrix
    │       ├── test_confusion_matrix.png       # Test split confusion matrix
    │       ├── predictions/                    # 10 representative test prediction images
    │       ├── false_positives/                # 10 sample false-positive images
    │       └── false_negatives/                # 10 sample false-negative images
    └── YOLOv26/
        ├── README.md                           # Detailed YOLO26 experiment documentation
        ├── YOLO26_railway_defect_best.pt       # Trained weights (5.14 MiB)
        ├── model.ipynb                         # Dataset conversion & training notebook
        ├── testing.ipynb                       # Testing & prediction notebook
        ├── training_log.csv                    # Per-epoch loss & validation metrics
        ├── evaluation_log.csv                  # Test evaluation log
        └── results/
            ├── results.csv                     # Raw Ultralytics training log (50 epochs)
            ├── results.png                     # Training and validation loss/metric curves
            ├── error_analysis.csv              # Per-image error records (long format)
            ├── confusion_matrix.png            # Validation confusion matrix
            ├── test_confusion_matrix.png       # Test split confusion matrix
            ├── predictions/                    # 10 representative test prediction images
            ├── false_positives/                # 10 sample false-positive images
            └── false_negatives/                # 10 sample false-negative images
```

---

## Experimental Results

All numbers below are extracted directly from the verified CSV files (`evaluation_log.csv`, `training_log.csv`, `results.csv`, `error_analysis.csv`) and cross-checked against `Model Dataset/comparison.ipynb`.

### Held-Out Test Set Performance

Evaluated using the standard Ultralytics evaluation pipeline (`split="test"`, `imgsz=640`, `batch=16`). Precision, recall, and F1-score are evaluated at the peak-F1 confidence threshold.

| Model | Checkpoint File | Size | Parameters (Fused) | Test Images | Ground-Truth Objects | Precision | Recall | F1-Score | mAP@50 | mAP@50-95 | Source File |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **YOLO11n** | `YOLO11_railway_defect_best.pt` | 5.22 MiB | 2,582,347 | 310 | 1,494 | **0.4770** | 0.4060 | **0.4390** | **0.4000** | **0.1440** | `Model Dataset/YOLOv11/evaluation_log.csv` |
| **YOLOv8n** | `YOLOv8_railway_defect_best.pt` | 5.96 MiB | 3,005,843 | 310 | 1,494 | 0.4316 | **0.4258** | 0.4287 | 0.3975 | 0.1372 | `Model Dataset/YOLOv8/evaluation_log.csv` |
| **YOLO26n** | `YOLO26_railway_defect_best.pt` | 5.14 MiB | 2,375,031 | 300 | 1,494 | 0.4344 | 0.3762 | 0.4032 | 0.3745 | 0.1363 | `Model Dataset/YOLOv26/evaluation_log.csv` |

**Key Observations:**
- **YOLO11n** achieved the highest overall performance on the test set across precision (0.477), F1-score (0.439), mAP@50 (0.400), and mAP@50-95 (0.144).
- **YOLOv8n** achieved the highest defect recall (0.4258), missing fewer ground-truth defect boxes than the other two models.
- **YOLO26n** has the smallest parameter footprint (2.37M parameters, 5.3 GFLOPs), but yielded lower recall (0.3762) and mAP@50 (0.3745) under the same 50-epoch budget.

### Error Analysis (Fixed Threshold)

In addition to standard metric evaluation, an independent object-level matching pass was conducted across test images using a fixed confidence threshold of `conf = 0.25` and an IoU matching threshold of `IoU ≥ 0.50` (reported in `results/error_analysis.csv`):

| Model | Test Images | GT Objects | Total Predictions | True Positives (TP) | False Positives (FP) | False Negatives (FN) | Empirical Precision (Fixed 0.25) | Empirical Recall (Fixed 0.25) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **YOLO11n** | 310 | 1,494 | 1,005 | **520** | 485 | **974** | 51.74% | **34.81%** |
| **YOLOv8n** | 310 | 1,494 | 861 | 463 | 398 | 1,031 | 53.77% | 30.99% |
| **YOLO26n** | 300 | 1,494 | 601 | 376 | **225** | 1,118 | **62.56%** | 25.17% |

*Note:* This error analysis uses greedy IoU matching at `conf=0.25` to inspect specific failure modes and isolate false alarm vs. missed detection behaviors. Representative samples of these failure cases are stored in `results/false_positives/` and `results/false_negatives/` inside each model folder.

### Training Hyperparameters

All models were trained on an **NVIDIA Tesla T4 GPU** (CUDA 12.8, PyTorch 2.11.0+cu128) using Ultralytics. The verified hyperparameters from the training logs and checkpoint metadata are:

| Parameter | YOLO11n | YOLOv8n | YOLO26n |
|---|---|---|---|
| **Base Architecture** | YOLO11n | YOLOv8n | YOLO26n |
| **Pretrained Weights** | `yolo11n.pt` | `yolov8n.pt` | `yolo26n.pt` |
| **Epochs Completed** | 50 | 50 | 50 |
| **Image Size (`imgsz`)** | 640 × 640 | 640 × 640 | 640 × 640 |
| **Batch Size** | 16 | 16 | 16 |
| **Optimizer** | AdamW | AdamW | AdamW |
| **Initial Learning Rate (`lr0`)** | 0.002 (auto) | 0.01 | 0.01 |
| **Final LR Factor (`lrf`)** | 0.01 | 0.01 | 0.01 |
| **Momentum** | 0.937 | 0.937 | 0.937 |
| **Weight Decay** | 0.0005 | 0.0005 | 0.0005 |
| **Warmup Epochs** | 3 | 3 | 3 |
| **Mosaic Augmentation** | 1.0 (disabled last 10 epochs) | 1.0 (disabled last 10 epochs) | 1.0 (disabled last 10 epochs) |
| **Automatic Mixed Precision (AMP)** | Enabled | Enabled | Enabled |
| **Random Seed** | 0 (Deterministic: True) | 0 (Deterministic: True) | 0 (Deterministic: True) |
| **Training Time** | 0.840 h (3,021.6 s) | 0.689 h (2,480.8 s) | 0.917 h (3,300.1 s) |
| **Best Model Selected At** | Epoch 46 (val mAP50-95: 0.1451) | Epoch 47 (val mAP50-95: 0.1290) | Epoch 50 (val mAP50-95: 0.1325) |

---

## RailGuard Full-Stack Application

**AI-Powered Railway Track Fault Detection and Monitoring System Using YOLO11**

RailGuard includes a production-quality full-stack prototype that enables operators and engineers to upload railway track imagery, run YOLO11 inference, and visualize defects with high-precision bounding boxes in real time.

### Architecture

```text
React Frontend (Vite)
       ↓  multipart/form-data (image)
REST API (/api/detect)
       ↓
FastAPI Backend
       ↓  Inference (imgsz=640)
YOLO11 Object Detector (best.pt)
       ↓
Detection Result (JSON + Annotated Imagery)
```

### Setup & Quickstart

#### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend loads `backend/models/best.pt` once at startup, keeps the model in memory, automatically uses CUDA when available (with graceful CPU fallback), and exposes:
- `GET  /api/health` — Service readiness & model status
- `POST /api/detect` — Single-image YOLO11 inference
- `GET  /api/result/{image_id}` — Annotated defect visualization fetch

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at:
```text
http://localhost:5173
```

### Environment Configuration

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

#### Backend Configuration Options
The backend can be configured via environment variables:
| Variable | Default | Description |
|---|---|---|
| `MODEL_PATH` | `models/best.pt` | Path to trained YOLO11 checkpoint |
| `CONFIDENCE_THRESHOLD` | `0.40` | Default confidence score cutoff |
| `IMAGE_SIZE` | `640` | YOLO inference input size |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed CORS origins |

---

## Installation

This repository does not rely on complex external wrappers. It uses standard PyTorch and Ultralytics.

```bash
# Clone the repository
git clone https://github.com/Balaji-Coder06/RailGuard.git
cd RailGuard

# Install required dependencies
pip install ultralytics==8.4.172 torch torchvision pandas numpy matplotlib pillow jupyter
```

---

## Usage

### Python Inference

You can run defect detection using any of the three trained checkpoints directly in Python:

```python
from ultralytics import YOLO

# 1. Load trained weights (select one)
model = YOLO("Model Dataset/YOLOv11/YOLO11_railway_defect_best.pt")
# model = YOLO("Model Dataset/YOLOv8/YOLOv8_railway_defect_best.pt")
# model = YOLO("Model Dataset/YOLOv26/YOLO26_railway_defect_best.pt")

# 2. Run prediction on a test image
results = model.predict(
    source="path/to/rail_image.jpg",
    imgsz=640,
    conf=0.25,
    save=True
)

# 3. Print bounding boxes and confidence scores
for result in results:
    for box in result.boxes:
        coords = box.xyxy.tolist()[0]
        confidence = float(box.conf)
        print(f"Defect detected at {coords} with confidence {confidence:.2f}")
```

### Ultralytics CLI Inference

You can also run predictions from your terminal using the Ultralytics CLI:

```bash
# Using YOLO11n
yolo predict model="Model Dataset/YOLOv11/YOLO11_railway_defect_best.pt" source="path/to/rail_image.jpg" imgsz=640 conf=0.25

# Using YOLOv8n
yolo predict model="Model Dataset/YOLOv8/YOLOv8_railway_defect_best.pt" source="path/to/rail_image.jpg" imgsz=640 conf=0.25

# Using YOLO26n
yolo predict model="Model Dataset/YOLOv26/YOLO26_railway_defect_best.pt" source="path/to/rail_image.jpg" imgsz=640 conf=0.25
```

### Running the Notebooks

All training, validation, error analysis, and comparative charts can be reproduced or inspected via Jupyter:

```bash
jupyter notebook
```
- Open `Model Dataset/comparison.ipynb` to view the comprehensive metric comparison and error analysis charts.
- Open `Model Dataset/<model>/model.ipynb` to view the full training run pipeline.
- Open `Model Dataset/<model>/testing.ipynb` to view test evaluation and prediction generation.

---

## Roadmap

The following features represent planned research and development extensions (currently **NOT implemented** in this repository):

- [ ] **Multi-Class Defect Categorization:** Train multi-head detectors to distinguish specific defect categories (Cracks, Joints, Squats, Flakings, Shellings, Spallings, Grooves) rather than binary defect detection.
- [ ] **Transformer-Based Object Detection:** Benchmark against real-time detection transformers (e.g., RF-DETR, RT-DETR) as noted in the model notes.
- [ ] **FPGA / Edge Hardware Acceleration:** Implement quantized, low-power neural networks (e.g., Binary Neural Networks or INT8 quantization) for deployment on edge FPGA boards (referencing papers in `reference research papers/`).
- [ ] **Automated Defect Severity Assessment:** Implement geometric defect measurement (depth, surface area, track boundary ratio) to grade defect severity.
- [ ] **Video Stream & Real-Time Track Monitoring:** Develop real-time video processing pipelines for automated inspection vehicles with frame-level defect tracking.
- [ ] **Production Web Dashboard & REST API:** Build a lightweight dashboard and API for live defect visualization and telemetry reporting.

---

## Author

**Balaji**  
GitHub: [@Balaji-Coder06](https://github.com/Balaji-Coder06)

---

## Acknowledgements & Dataset Credits

- **Base Dataset:** Arain, A., Mehran, S., Shaikh, M. Z., Kumar, D., Hussain, T., & Chowdhry, B. S., *Railway Track Surface Faults Dataset*, Mendeley Data, V2, doi: [10.17632/8hxtgyyxrw.2](https://data.mendeley.com/datasets/8hxtgyyxrw/2). Published under CC BY 4.0.
- **Reference Datasets:** Roboflow Universe railway defect detection community datasets.
- **Framework:** [Ultralytics](https://docs.ultralytics.com/) (licensed under AGPL-3.0). Checkpoints trained using Ultralytics are subject to upstream license terms.
- **Research Literature:** Research papers included in `reference research papers/` for edge AI, FPGA hardware co-design, and condition monitoring reference.
