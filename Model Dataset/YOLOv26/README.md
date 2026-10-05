# RailGuard — YOLO26 Railway Defect Detection

## Overview

YOLO26n was trained as part of the RailGuard project:

**Railway Track Fault Detection and Monitoring System Using AI**

The model performs single-class object detection for railway track defects.

### Class

| ID | Class  |
|---:|--------|
| 0  | defect |

---

## Dataset

The model uses the Mendeley Railway Defects Detection Dataset.

The original YOLO annotations were converted into a binary detection problem:

```text
0 → defect
```

Bounding-box coordinates were preserved during conversion.

### Dataset After Cleaning

| Split      | Images | Labels |
|------------|-------:|-------:|
| Train      | 6,681  | 6,681  |
| Validation | 606    | 606    |
| Test       | 300    | 300    |

- Total test ground-truth objects: **1,494**
- Total bounding boxes across the dataset: **35,549**
- No synthetic data was used.

---

## Model

- **Model:** YOLO26n
- **Task:** Object Detection
- **Framework:** Ultralytics
- **Pretrained model:** `yolo26n.pt`

### Model Architecture

```text
Parameters: 2,375,031
GFLOPs:     5.3
Layers:     120
```

---

## Training Configuration

| Parameter             | Value       |
|-----------------------|-------------|
| Epochs                | 50          |
| Batch Size            | 16          |
| Image Size            | 640 × 640   |
| Optimizer             | AdamW       |
| Pretrained            | Yes         |
| AMP                   | Enabled     |
| Seed                  | 0           |
| Deterministic         | True        |
| Workers               | 8           |
| Initial Learning Rate | 0.01        |
| Final LR Factor       | 0.01        |
| Momentum              | 0.937       |
| Weight Decay          | 0.0005      |
| Warmup Epochs         | 3           |
| Mosaic                | 1.0         |
| Mixup                 | 0.0         |
| Close Mosaic          | 10          |
| Device                | Tesla T4    |

### Software Environment

```text
Ultralytics: 8.4.173
Python:      3.13.15
PyTorch:     2.11.0+cu128
GPU:         Tesla T4
```

Training completed in approximately **0.917 hours**.

---

## Validation Results

Final validation results from the 50-epoch training run:

| Metric    | Score |
|-----------|------:|
| Precision | 0.439 |
| Recall    | 0.373 |
| mAP@50    | 0.355 |
| mAP@50-95 | 0.133 |

---

## Test Results

The final model was evaluated on the cleaned 300-image test set.

| Metric               | Score |
|----------------------|------:|
| Test Images          | 300   |
| Ground-Truth Objects | 1,494 |
| Precision            | 0.434 |
| Recall               | 0.376 |
| F1-Score             | 0.403 |
| mAP@50               | 0.375 |
| mAP@50-95            | 0.136 |

### Object-Level Error Analysis

Using IoU ≥ 0.50 for prediction-to-ground-truth matching:

| Metric          | Count |
|-----------------|------:|
| True Positives  | 376   |
| False Positives | 225   |
| False Negatives | 1,118 |

---

## Inference Performance

Test evaluation speed:

```text
Preprocessing:  1.7 ms/image
Inference:      5.0 ms/image
Postprocessing: 1.9 ms/image
```

Prediction generation averaged approximately **10.0 ms/image**.

Predictions were generated for all 300 test images.

---

## Logs

### Training Logs

The repository includes the complete 50-epoch training history: `training_log.csv`

The log contains:

- Training box loss
- Training classification loss
- Training L1 loss
- Validation box loss
- Validation classification loss
- Validation L1 loss
- Precision
- Recall
- mAP@50
- mAP@50-95

### Evaluation Logs

Final test evaluation information is stored in: `evaluation_log.csv`

It contains the final:

- Precision
- Recall
- F1-score
- mAP@50
- mAP@50-95
- TP
- FP
- FN
- Inference time

---

## Repository Structure

```text
YOLO26/
├── results/
│   ├── predictions/
│   ├── confusion_matrix.png
│   ├── results.png
│   └── ...
│
├── YOLO26_railway_defect_best.pt
├── training_log.csv
├── evaluation_log.csv
├── model.ipynb
├── testing.ipynb
└── README.md
```

---

## Error Analysis

The model's predictions were analyzed against the ground-truth annotations. The analysis identified:

- True positive detections
- False positive detections
- False negative detections

Example FP/FN images were generated during the error-analysis stage for qualitative inspection.

---

## Reproducibility

The model was trained using:

```text
Model:         YOLO26n
Epochs:        50
Image Size:    640
Batch Size:    16
Optimizer:     AdamW
Seed:          0
Deterministic: True
```

The complete training history and final evaluation metrics are included in the repository logs.

---

## Project

RailGuard is an AI-based railway track fault detection and monitoring system designed to detect visible railway track defects using computer vision.

YOLO26 is one of the object-detection models evaluated as part of the RailGuard model comparison. Other evaluated models include:

- YOLO11
- YOLOv8
- YOLO26
- RF-DETR
