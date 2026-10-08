# RailGuard — YOLOv8 Railway Defect Detection (Phase 1 Baseline)

> Part of **RailGuard**: *AI-Based Railway Track Fault Detection, Localization, Severity Assessment and Real-Time Monitoring System*

| | |
|---|---|
| **Model** | YOLOv8n (Ultralytics) |
| **Task** | Phase 1 Baseline: Single-class railway-defect object detection (1 class: `defect`) |
| **Weights** | `YOLOv8_railway_defect_best.pt` (5.96 MiB) |
| **Ultralytics** | 8.4.172 |
| **Dataset** | Railway Track Surface Faults Dataset v2 (Mendeley Data), converted to a single `defect` class (Phase 1) |

---

## 1. Overview

This folder contains the complete YOLOv8 experiment for RailGuard: dataset conversion, training, validation, test evaluation, prediction outputs and false-positive / false-negative analysis.

The model is an object detector. For each image it predicts:

- whether a railway defect is present,
- where it is (bounding box),
- how confident it is (confidence score).

For this Phase 1 experiment, the original multi-class annotations were collapsed into one class, so the model answers **"Where is a railway defect?"** It does **not** answer **"What type of defect is it?"**, and it does not provide GPS coordinates, track chainage or a validated severity assessment.

## 2. Results at a Glance

Held-out test set: **310 images, 1,494 ground-truth objects**.

| Precision | Recall | F1-score | mAP@50 | mAP@50-95 |
|---:|---:|---:|---:|---:|
| 0.4316 | 0.4258 | 0.4287 | 0.3975 | 0.1372 |

Training time: 0.689 h on a Tesla T4 · Model size: 5.96 MiB · Parameters: 3,005,843 (fused).

![Training curves](results/results.png)

---

## 3. Dataset

### 3.1 Source

**Railway Track Surface Faults Dataset**, Version 2, published 6 January 2022 on Mendeley Data.

- DOI: [10.17632/8hxtgyyxrw.2](https://data.mendeley.com/datasets/8hxtgyyxrw/2)
- Contributors: Asfar Arain, Sanaullah Mehran, Muhammad Zakir Shaikh, Dileep Kumar, Tanweer Hussain, Bhawani Shankar Chowdhry
- Institution: Mehran University of Engineering and Technology (NCRA Condition Monitoring Systems Lab), Jamshoro, Pakistan
- Data article: <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10828558/>

**Acquisition.** Video was recorded at 120 FPS by two EKEN-H9R cameras mounted on both sides of a railway inspection vehicle (Pakistan Railway, Kotri Junction). Unnecessary video was removed, frames were extracted, and the frames were labelled manually. The dataset page lists these defect types: Grooves, Joints, Cracks, Flakings, Shellings, Spallings and Squats.

**Working copy.** The experiment used a YOLOv8-format export of this data (`rail defects detection.v18i.yolov8`) stored as a Kaggle dataset, already divided into `train`, `valid` and `test` splits. The exported labels contain class IDs `0`–`9`.

### 3.2 Annotation Format

YOLO detection format, one object per line, coordinates normalised to the image size:

```text
class_id x_center y_center width height
```

### 3.3 Phase 1 Single-Class Conversion

For this baseline, every original class ID was mapped to a single class. Only the class ID changes; the box coordinates are untouched.

```text
Original:  3 0.421 0.512 0.125 0.180
Single:    0 0.421 0.512 0.125 0.180
```

Label files left with no valid lines are not written, so those images are treated by Ultralytics as **background images** (no objects). The conversion only remaps labels; no synthetic images or synthetic annotations were generated.

`data.yaml` used for training:

```yaml
path: /kaggle/working/railway_defect_binary
train: train/images
val: valid/images
test: test/images

nc: 1
names:
  0: defect
```

### 3.4 Splits

| Split | Images | Label files |
|---|---:|---:|
| Train | 6,781 | 6,656 |
| Validation | 606 | 600 |
| Test | 310 | 297 |

Images without a label file are background images. In the test set, **13 of the 310 images contain no annotated objects**.

---

## 4. Model

| Item | Value |
|---|---|
| Architecture | YOLOv8n |
| Pretrained weights | `yolov8n.pt` (Ultralytics) |
| Task | Object detection |
| Classes | 1 — `{0: defect}` (Phase 1 Baseline) |
| Parameters (training model) | 3,011,043 |
| Parameters (fused, inference) | 3,005,843 |
| Weights file | `YOLOv8_railway_defect_best.pt` — 6,250,602 bytes (5.96 MiB) |

---

## 5. Training Configuration

Values below are read from the training arguments stored inside `YOLOv8_railway_defect_best.pt`.

| Parameter | Value |
|---|---|
| Epochs | 50 (all completed; `patience` = 100, early stopping not triggered) |
| Image size | 640 × 640 |
| Batch size | 16 |
| Optimizer | AdamW |
| Initial learning rate (`lr0`) | 0.01 |
| Final LR factor (`lrf`) | 0.01 |
| Momentum | 0.937 |
| Weight decay | 0.0005 |
| Warmup epochs | 3 |
| Mosaic | 1.0 |
| Mixup | 0.0 |
| Close mosaic | last 10 epochs |
| AMP | Enabled |
| Seed | 0 |
| Deterministic | True |
| Pretrained | True |
| Workers | 8 |

Hardware and software:

```text
GPU:         NVIDIA Tesla T4
CUDA:        12.8
PyTorch:     2.11.0+cu128
Python:      3.13.15
Ultralytics: 8.4.172
```

Training time: **0.689 hours** (2,480.8 s, from `results/results.csv`).

Equivalent training call:

```python
from ultralytics import YOLO

model = YOLO("yolov8n.pt")
model.train(
    data="data.yaml",
    epochs=50, imgsz=640, batch=16,
    optimizer="AdamW", amp=True,
    seed=0, deterministic=True, pretrained=True,
    workers=8,
)
```

---

## 6. Validation Results

`best.pt` was selected by Ultralytics at **epoch 47** (highest mAP@50-95, 0.12903). Validation split: 606 images, 2,838 instances.

| Metric | `best.pt` re-validated | Epoch 47 (best) | Epoch 50 (final) |
|---|---:|---:|---:|
| Precision | 0.429 | 0.432 | 0.430 |
| Recall | 0.378 | 0.377 | 0.378 |
| mAP@50 | 0.355 | 0.354 | 0.351 |
| mAP@50-95 | 0.129 | 0.129 | 0.128 |

The epoch columns come from `training_log.csv`. The highest mAP@50 recorded during training was 0.354, also at epoch 47.

Final-epoch losses (`results/results.csv`):

| | Box | Cls | DFL |
|---|---:|---:|---:|
| Train | 2.020 | 1.832 | 1.709 |
| Validation | 2.191 | 1.944 | 1.734 |

---

## 7. Test Results

Evaluated with the Ultralytics pipeline (`split="test"`, `imgsz=640`, `batch=16`).

| Metric | Result |
|---|---:|
| Images | 310 |
| Ground-truth objects | 1,494 |
| Precision | 0.4316 |
| Recall | 0.4258 |
| F1-score | 0.4287 |
| mAP@50 | 0.3975 |
| mAP@50-95 | 0.1372 |
| Evaluation time | 6.69 s |

F1 is computed from the recorded precision and recall:

```text
F1 = 2 × P × R / (P + R) = 2 × 0.4316 × 0.4258 / (0.4316 + 0.4258) = 0.4287
```

Ultralytics reports precision and recall at the confidence threshold that maximises F1. The complete record is in `evaluation_log.csv`.

---

## 8. False-Positive / False-Negative Analysis

A separate, per-image error analysis was run on all 310 test images.

- Predictions generated with `conf = 0.25`
- Predicted and ground-truth boxes matched by IoU ≥ 0.50 (each ground-truth box can be matched once)
- Unmatched predictions are false positives; unmatched ground-truth boxes are false negatives

| Category | Count |
|---|---:|
| Ground-truth objects | 1,494 |
| Predicted objects | 861 |
| True positives | 463 |
| False positives | 398 |
| False negatives | 1,031 |

At this fixed threshold the detector's precision is 463 / 861 = 0.538 and its recall is 463 / 1,494 = 0.310.

> **Important.** This analysis uses its own fixed confidence threshold and greedy matching, so its counts are not meant to reproduce the Ultralytics precision/recall in Section 7. The official metrics are the ones in Section 7; this analysis is for understanding failure cases.

Image-level breakdown (310 images):

| Category | Images |
|---|---:|
| False positives and false negatives | 172 |
| False negatives only | 85 |
| False positives only | 29 |
| Correct detections only (no errors) | 20 |
| No objects and no predictions | 4 |

Example images are saved in `results/false_positives/` (the 10 images with the most false positives) and `results/false_negatives/` (the 10 with the most false negatives). Per-image counts are in `results/error_analysis.csv` with columns `image, ground_truth, predictions, TP, FP, FN, error_type`.

---

## 9. Test Predictions and Inference Speed

Predictions were generated for all 310 test images at `conf = 0.25`, with annotated images and text labels (including confidences) saved.

```text
Images processed:           310
Images with ≥1 detection:   273  (273 label files)
Total prediction time:      3.72 s
Average time per image:     12.00 ms
Test evaluation time:       6.69 s
```

The prediction time includes writing the annotated images and label files to disk, and speed varies with GPU, runtime and preprocessing. Treat these as experimental observations on a Tesla T4, not a hardware-independent benchmark.

---

## 10. Repository Contents

```text
YOLOv8/
├── results/
│   ├── predictions/                    # 310 annotated test images + labels/ (273 .txt files)
│   ├── false_positives/                # 10 example images
│   ├── false_negatives/                # 10 example images
│   ├── error_analysis.csv              # per-image TP / FP / FN
│   ├── results.csv                     # full per-epoch Ultralytics log
│   ├── results.png                     # training curves
│   ├── confusion_matrix.png
│   ├── confusion_matrix_normalized.png
│   ├── BoxP_curve.png
│   ├── BoxR_curve.png
│   ├── BoxF1_curve.png
│   └── BoxPR_curve.png
├── model.ipynb                         # dataset conversion + training + validation
├── testing.ipynb                       # test evaluation + prediction + error analysis
├── training_log.csv                    # epoch, precision, recall, mAP50, mAP50-95 (50 epochs)
├── evaluation_log.csv                  # final test metrics + TP / FP / FN
└── YOLOv8_railway_defect_best.pt       # trained weights
```

The confusion matrices and the P / R / F1 / PR curves were generated on the validation split during training.

---

## 11. Quick Start

```bash
pip install ultralytics==8.4.172
```

```python
from ultralytics import YOLO

model = YOLO("YOLOv8_railway_defect_best.pt")

# Run detection on an image
results = model.predict("track.jpg", imgsz=640, conf=0.25, save=True)

for box in results[0].boxes:
    print(box.xyxy.tolist(), float(box.conf))   # bounding box + confidence
```

To re-evaluate on your own copy of the single-class dataset:

```python
model.val(data="data.yaml", split="test", imgsz=640, batch=16)
```

---

## 12. Capabilities and Limitations

**Supports:** railway defect detection, single-class defect identification, bounding-box localisation, confidence scores, test-set evaluation, false-positive and false-negative analysis.

**Does not provide:**

- specific defect-type classification
- GPS coordinates or track chainage
- scientifically validated severity assessment

**Caveats:**

- Absolute performance is modest (mAP@50 ≈ 0.40, recall below 0.43); this is a baseline, not a deployment-ready inspector.
- Only one dataset was used, with no external or cross-dataset validation yet.
- Images are frames from continuous inspection video. The splits were not verified to be video-disjoint, so near-identical frames may appear in different splits and results may be optimistic for unseen track.
- Only the `n` (nano) model size was trained.

---

## 13. Model Comparison

Test-set results for the three detectors trained in this repository (see `../comparison.ipynb`):

| Model | Test images | Precision | Recall | F1 | mAP@50 | mAP@50-95 |
|---|---:|---:|---:|---:|---:|---:|
| YOLO11n | 310 | 0.477 | 0.406 | 0.439 | 0.400 | 0.144 |
| **YOLOv8n (this folder)** | 310 | 0.432 | 0.426 | 0.429 | 0.398 | 0.137 |
| YOLO26n | 300 | 0.434 | 0.376 | 0.403 | 0.375 | 0.136 |

YOLO26n was evaluated on a 300-image test split (the same 1,494 annotated objects, without 10 object-free images), so the comparison is close but not identical across all three. RF-DETR is planned as a later comparison and is not included in this repository yet.

---

## 14. Reproducibility

```text
Dataset:       Railway Track Surface Faults Dataset v2 → single-class (1 class)
Model:         YOLOv8n, pretrained yolov8n.pt
Epochs:        50      Image size: 640      Batch size: 16
Optimizer:     AdamW   AMP: enabled
Seed:          0       Deterministic: True
Ultralytics:   8.4.172 PyTorch: 2.11.0+cu128 Python: 3.13.15 GPU: Tesla T4
```

The notebooks `model.ipynb` and `testing.ipynb` document the full workflow. Small run-to-run differences can still occur across hardware and library versions.

---

## 15. Research Integrity

- All reported numbers come from experiments on the dataset referenced above.
- No synthetic training data was generated by this pipeline.
- No GPS or location information is invented or inferred from the data.
- Claims supported by these results: **single-class baseline railway-defect detection and bounding-box localisation only.**

## 16. Acknowledgements and License

- Dataset: Arain et al., *Railway Track Surface Faults Dataset*, Mendeley Data, V2, doi:10.17632/8hxtgyyxrw.2 — please refer to the Mendeley page for its license and citation terms.
- Training framework: [Ultralytics](https://docs.ultralytics.com) (AGPL-3.0). Weights trained with Ultralytics are subject to its license terms.
