# YOLO11 Railway Defect Detection

## RailGuard

**Project:** AI-Based Railway Track Fault Detection, Localization, Severity Assessment and Real-Time Monitoring System

**Model:** YOLO11n  
**Task:** Binary Railway Defect Object Detection

---

## 1. Overview

This directory contains the complete YOLO11 experiment developed for the **RailGuard** project.

The objective of this experiment is to detect railway track defects from images using an object detection model.

Unlike image classification, the model predicts:

- Whether a railway defect is present
- The location of the detected defect using a bounding box
- The confidence score of the detection

For this experiment, the original multi-class railway defect annotations were converted into a **single binary object-detection class**:

```text
0: defect
```

Therefore, the current YOLO11 model answers:

> **Where is a railway defect?**

It does not currently determine:

> **What specific type of defect is present?**

The current YOLO11 experiment also does not provide GPS coordinates, track chainage, or scientifically validated severity assessment.

---

## 2. Dataset

### 2.1 Dataset Source

The experiment uses the **Rail Defects Detection Dataset** published on Mendeley Data.

**Dataset:** Railway Defects Detection Dataset  
**Version:** 2

Source: <https://data.mendeley.com/datasets/88sh5y3tmj/2>

The original dataset contains multiple railway defect categories with YOLO-format annotations.

### 2.2 Dataset Format

The dataset uses the YOLO object-detection annotation format:

```text
class_id x_center y_center width height
```

The bounding-box coordinates are normalized relative to the image dimensions.

### 2.3 Original Dataset Classes

The original annotations contain multiple defect classes with class IDs:

```text
0, 1, 2, 3, 4, 5, 6, 7, 8, 9
```

For this YOLO11 experiment, these classes were converted into a single binary detection class.

---

## 3. Dataset Preparation

The objective of the current experiment is **binary railway defect detection**.

All original railway-defect classes were mapped to:

```text
0: defect
```

The original bounding-box coordinates were preserved.

For example:

```text
Original:
3 0.421 0.512 0.125 0.180

Binary:
0 0.421 0.512 0.125 0.180
```

Only the class ID was changed.

No synthetic images, synthetic annotations, or artificially generated training data were used.

---

## 4. Dataset Split

The binary dataset used for YOLO11 training and evaluation contains:

| Split | Images | Label Files |
|---|---:|---:|
| Train | 6781 | 6656 |
| Validation | 606 | 600 |
| Test | 310 | 297 |

Some images contain no annotations and are therefore treated as background images.

The original test split contains:

- **310 images**
- **1555 annotated objects**
- **3 empty annotation files**

The final binary test set used for error analysis contains all 310 test images and preserves the original bounding-box coordinates.

---

## 5. Model

### 5.1 Architecture

The model used in this experiment is:

```text
YOLO11n
```

The model was initialized using the pretrained:

```text
yolo11n.pt
```

and fine-tuned on the binary railway-defect dataset.

### 5.2 Detection Class

The final model contains one detection class:

| Class ID | Class |
|---:|---|
| 0 | defect |

---

## 6. Training Configuration

| Parameter | Value |
|---|---|
| Model | YOLO11n |
| Pretrained Weights | yolo11n.pt |
| Number of Classes | 1 |
| Epochs | 50 |
| Image Size | 640 × 640 |
| Batch Size | 16 |
| Optimizer | AdamW |
| AMP | Enabled |
| Random Seed | 0 |
| Hardware | NVIDIA Tesla T4 |
| CUDA | 12.8 |
| Ultralytics | 8.4.172 |
| Approx. Training Time | 0.84 hours |

Training was performed using the binary railway-defect dataset.

---

## 7. Training Artifacts

The following training artifacts are included in this directory:

```text
model.ipynb
training_log.csv
YOLO11_railway_defect_best.pt
```

The trained model weights are:

```text
YOLO11_railway_defect_best.pt
```

Approximate model size:

```text
5.22 MB
```

---

## 8. Validation Results

The best YOLO11 model was evaluated on the validation split.

| Metric | Result |
|---|---:|
| Images | 606 |
| Instances | 2838 |
| Precision | 0.444 |
| Recall | 0.416 |
| mAP@50 | 0.389 |
| mAP@50-95 | 0.145 |

---

## 9. Test Evaluation

The trained model was evaluated on the held-out test set.

| Metric | Result |
|---|---:|
| Images | 310 |
| Instances | 1494 |
| Precision | 0.477 |
| Recall | 0.406 |
| F1-score | 0.439 |
| mAP@50 | 0.400 |
| mAP@50-95 | 0.144 |

### F1-score

The F1-score was calculated from the recorded precision and recall:

```text
F1 = 2 × Precision × Recall
     --------------------------
       Precision + Recall
```

Using:

```text
Precision = 0.477
Recall    = 0.406
```

the resulting F1-score is approximately:

```text
F1 = 0.439
```

---

## 10. Evaluation Artifacts

The repository contains the following evaluation artifacts:

```text
results/
├── predictions/
├── confusion_matrix.png
├── test_confusion_matrix.png
├── results.csv
└── results.png
```

The evaluation log is:

```text
evaluation_log.csv
```

---

## 11. Confusion Matrices

Two confusion-matrix artifacts are included:

```text
results/confusion_matrix.png
results/test_confusion_matrix.png
```

These provide visual summaries of model detection performance.

---

## 12. Test Predictions

Predictions were generated for all 310 test images.

Representative prediction images are stored under:

```text
results/predictions/
```

A separate prediction run was also performed using a confidence threshold of:

```text
0.50
```

---

## 13. Inference Performance

During testing, inference was approximately:

```text
~10 ms/image
```

The actual inference speed can vary depending on the GPU, runtime environment, preprocessing, and hardware utilization.

Therefore, this value should be treated as an approximate experimental observation rather than a hardware-independent benchmark.

---

## 14. False Positive and False Negative Analysis

A dedicated error analysis was performed on the 310-image test set.

The analysis used:

```text
Confidence threshold: 0.25
IoU matching threshold: 0.50
```

The object-level results were:

| Category | Count |
|---|---:|
| True Positives | 520 |
| False Positives | 485 |
| False Negatives | 974 |

The complete analysis is stored in:

```text
error_analysis.csv
```

Representative false-positive and false-negative examples were also generated.

These examples identify cases where:

- The model detects a defect without a matching ground-truth defect.
- The model fails to detect a ground-truth defect.

### Important Evaluation Note

The FP/FN analysis is a **separate error-analysis procedure** and does not replace the official Ultralytics evaluation metrics reported in the Test Evaluation section.

The official test metrics were obtained using the Ultralytics evaluation pipeline.

The separate error analysis used:

```text
Confidence threshold = 0.25
IoU threshold = 0.50
```

This distinction is maintained to avoid mixing results produced by different evaluation procedures.

---

## 15. Reproducibility

The following information is recorded to support reproducibility.

### Dataset

```text
Mendeley Railway Defects Detection Dataset
Version 2
```

### Task

```text
Binary object detection
```

### Model

```text
YOLO11n
```

### Training

```text
Epochs:       50
Image size:   640
Batch size:   16
Optimizer:    AdamW
AMP:          Enabled
Seed:         0
```

### Environment

```text
Ultralytics:  8.4.172
GPU:          NVIDIA Tesla T4
CUDA:         12.8
```

### Training Time

```text
Approximately 0.84 hours
```

The training and testing notebooks are included in this directory to document the experimental workflow.

---

## 16. Repository Contents

```text
YOLO11/
├── results/
│   ├── predictions/
│   ├── confusion_matrix.png
│   ├── test_confusion_matrix.png
│   ├── results.csv
│   └── results.png
├── model.ipynb
├── testing.ipynb
├── training_log.csv
├── evaluation_log.csv
├── YOLO11_railway_defect_best.pt
└── README.md
```

The final error-analysis artifacts can additionally be organized as:

```text
results/
├── false_positives/
├── false_negatives/
└── error_analysis.csv
```

---

## 17. Current Capabilities

The current YOLO11 experiment supports:

- Railway defect detection
- Binary defect identification
- Bounding-box localization
- Confidence-score output
- Test-set evaluation
- False-positive analysis
- False-negative analysis

---

## 18. Current Limitations

The current YOLO11 binary detector does **not** provide:

- Specific defect-type classification
- GPS coordinates
- Track chainage
- Scientifically validated severity assessment

These capabilities should not be claimed based on the current YOLO11 experiment.

---

## 19. Research Scope

The YOLO11 experiment establishes a binary railway-defect detection baseline for the RailGuard project.

Future experiments may compare the YOLO11 detector against other object-detection architectures using the same dataset and evaluation methodology.

Planned model comparison:

```text
YOLO11
YOLOv8
RF-DETR
```

The comparison will consider:

- Precision
- Recall
- F1-score
- mAP@50
- mAP@50-95
- Inference speed
- False positives
- False negatives

An independent railway-defect dataset may also be used in a later experiment to evaluate cross-dataset generalization.

---

## 20. Research Integrity

All reported results in this directory correspond to experiments performed using the referenced railway-defect dataset.

No synthetic training data was used.

No GPS or location information is invented or inferred from the dataset.

The current results support claims about **binary railway-defect detection and bounding-box localization only**.

---

## 21. Summary

The YOLO11 experiment provides a reproducible binary railway-defect detection baseline for RailGuard.

### Final Test Performance

| Metric | Result |
|---|---:|
| Precision | 0.477 |
| Recall | 0.406 |
| F1-score | 0.439 |
| mAP@50 | 0.400 |
| mAP@50-95 | 0.144 |
| Approx. Inference Speed | ~10 ms/image |

The trained model, notebooks, logs, evaluation results, confusion matrices, and prediction artifacts are maintained in this directory.