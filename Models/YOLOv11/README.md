# RailGuard — YOLO11 Railway Defect Detection (Phase 1 Baseline)

> Part of **RailGuard**: *AI-Based Railway Track Fault Detection, Localization, Severity Assessment and Real-Time Monitoring System*

| | |
|---|---|
| **Model** | YOLO11n (Ultralytics) |
| **Task** | Phase 1 Baseline: Single-class railway-defect object detection (1 class: `defect`) |
| **Weights** | `YOLO11_railway_defect_best.pt` (5.22 MiB) |
| **Ultralytics** | 8.4.172 |
| **Dataset** | Railway Track Surface Faults Dataset v2 (Mendeley Data), converted to a single `defect` class (Phase 1) |

---

## 1. Overview

This folder contains the complete YOLO11 experiment for RailGuard: dataset conversion, training, validation, test evaluation, prediction outputs and false-positive / false-negative analysis.

The model is an object detector. For each image it predicts:

- whether a railway defect is present,
- where it is (bounding box),
- how confident it is (confidence score).

For this Phase 1 experiment, the original multi-class annotations were collapsed into one class, so the model answers **"Where is a railway defect?"** It does **not** answer **"What type of defect is it?"**, and it does not provide GPS coordinates, track chainage or a validated severity assessment.

## 2. Results at a Glance

Held-out test set: **310 images, 1,494 ground-truth objects**.

| Precision | Recall | F1-score | mAP@50 | mAP@50-95 |
|---:|---:|---:|---:|---:|
| 0.477 | 0.406 | 0.439 | 0.400 | 0.144 |

Training time: 0.84 h on a Tesla T4 · Model size: 5.22 MiB · Parameters: 2,582,347 (fused).

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

Images without a label file are background images. In the test set, **13 of the 310 images contain no annotated objects**, and all 310 test images are used for evaluation and error analysis.

---

## 4. Model

| Item | Value |
|---|---|
| Architecture | YOLO11n |
| Pretrained weights | `yolo11n.pt` (Ultralytics) |
| Task | Object detection |
| Classes | 1 — `{0: defect}` (Phase 1 Baseline) |
| Parameters (training model) | 2,590,035 |
| Parameters (fused, inference) | 2,582,347 |
| Weights file | `YOLO11_railway_defect_best.pt` — 5,472,858 bytes (5.22 MiB) |

---

## 5. Training Configuration

Values below are read from the training arguments stored inside `YOLO11_railway_defect_best.pt`.

| Parameter | Value |
|---|---|
| Epochs | 50 (all completed) |
| Early-stopping patience | 10 (not triggered) |
| Image size | 640 × 640 |
| Batch size | 16 |
| Optimizer | AdamW (chosen automatically by Ultralytics; not set explicitly in the notebook) |
| Initial learning rate (`lr0`) | 0.002 (set by the automatic optimizer choice) |
| Final LR factor (`lrf`) | 0.01 |
| Weight decay | 0.0005 |
| Warmup epochs | 3 |
| Mosaic | 1.0 |
| Mixup | 0.0 |
| Close mosaic | last 10 epochs |
| AMP | Enabled |
| Seed | 0 |
| Deterministic | True |
| Pretrained | True |
| Workers | 2 |
| Device | GPU 0 |

Hardware and software:

```text
GPU:         NVIDIA Tesla T4
CUDA:        12.8
Ultralytics: 8.4.172
```

Training time: **0.84 hours** (3,021.55 s, from `results/results.csv`).

Equivalent training call:

```python
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
model.train(
    data="data.yaml",
    epochs=50, imgsz=640, batch=16,
    patience=10, pretrained=True,
    seed=0, deterministic=True,
    workers=2, device=0,
)
```

---

## 6. Validation Results

`best.pt` was selected by Ultralytics at **epoch 46** (highest mAP@50-95, 0.14513). Validation split: 606 images, 2,838 instances.

| Metric | `best.pt` re-validated | Epoch 46 (best) | Epoch 50 (final) |
|---|---:|---:|---:|
| Precision | 0.444 | 0.447 | 0.441 |
| Recall | 0.416 | 0.417 | 0.426 |
| mAP@50 | 0.389 | 0.390 | 0.387 |
| mAP@50-95 | 0.145 | 0.145 | 0.144 |

The re-validated column is the `validation` row of `evaluation_log.csv`; the epoch columns come from `training_log.csv`. The highest mAP@50 recorded during training was 0.391, at epoch 47.

Final-epoch losses (`training_log.csv`):

| | Box | Cls | DFL |
|---|---:|---:|---:|
| Train | 1.898 | 1.634 | 1.533 |
| Validation | 2.178 | 1.833 | 1.640 |

---

## 7. Test Results

Evaluated with the Ultralytics pipeline (`split="test"`, `imgsz=640`, `batch=16`).

| Metric | Result |
|---|---:|
| Images | 310 |
| Ground-truth objects | 1,494 |
| Precision | 0.477 |
| Recall | 0.406 |
| F1-score | 0.439 |
| mAP@50 | 0.400 |
| mAP@50-95 | 0.144 |

F1 is computed from the recorded precision and recall:

```text
F1 = 2 × P × R / (P + R) = 2 × 0.477 × 0.406 / (0.477 + 0.406) = 0.439
```

Ultralytics reports precision and recall at the confidence threshold that maximises F1. The metrics are stored to three decimals in `evaluation_log.csv` (rows `validation` and `test`).

![Test confusion matrix](results/test_confusion_matrix.png)

---

## 8. False-Positive / False-Negative Analysis

A separate, per-image error analysis was run on all 310 test images.

- Predictions generated with `conf = 0.25`
- Predicted and ground-truth boxes matched by IoU ≥ 0.50 (each ground-truth box can be matched once)
- Unmatched predictions are false positives; unmatched ground-truth boxes are false negatives

| Category | Count |
|---|---:|
| Ground-truth objects | 1,494 |
| Predicted objects | 1,005 |
| True positives | 520 |
| False positives | 485 |
| False negatives | 974 |

At this fixed threshold the detector's precision is 520 / 1,005 = 0.517 and its recall is 520 / 1,494 = 0.348.

> **Important.** This analysis uses its own fixed confidence threshold and greedy matching, so its counts are not meant to reproduce the Ultralytics precision/recall in Section 7. The official metrics are the ones in Section 7; this analysis is for understanding failure cases.

Image-level breakdown (310 images):

| Category | Images |
|---|---:|
| False positives and false negatives | 172 |
| False negatives only | 74 |
| False positives only | 31 |
| Correct detections only (no errors) | 30 |
| No objects and no predictions | 3 |

Example images are saved in `results/false_positives/` and `results/false_negatives/` (10 each). Per-image counts are in `results/error_analysis.csv` with columns `image, ground_truth, predictions, TP, FP, FN, error_type`.

---

## 9. Test Predictions and Inference Speed

Predictions were generated for all 310 test images at `conf = 0.25`; 281 of them contained at least one detection. A second prediction run used a higher threshold of `conf = 0.50`. `results/predictions/` holds 10 representative annotated test images (`prediction_01.jpg` … `prediction_10.jpg`).

Inference speed was approximately **10 ms/image** during testing on a Tesla T4. This is an approximate observation (not stored in a log file) and varies with GPU, runtime and preprocessing; it is not a hardware-independent benchmark.

---

## 10. Repository Contents

```text
YOLOv11/
├── results/
│   ├── predictions/                    # 10 representative annotated test images
│   ├── false_positives/                # 10 example images
│   ├── false_negatives/                # 10 example images
│   ├── error_analysis.csv              # per-image TP / FP / FN
│   ├── results.csv                     # full per-epoch Ultralytics log
│   ├── results.png                     # training curves
│   ├── confusion_matrix.png            # validation split
│   └── test_confusion_matrix.png       # test split
├── model.ipynb                         # dataset conversion + training + validation
├── testing.ipynb                       # test evaluation + prediction
├── training_log.csv                    # full per-epoch log (losses, P, R, mAP, learning rate)
├── evaluation_log.csv                  # validation and test metrics
└── YOLO11_railway_defect_best.pt       # trained weights
```

---

## 11. Quick Start

```bash
pip install ultralytics==8.4.172
```

```python
from ultralytics import YOLO

model = YOLO("YOLO11_railway_defect_best.pt")

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

- Absolute performance is modest (mAP@50 = 0.40, recall = 0.41); this is a baseline, not a deployment-ready inspector.
- Only one dataset was used, with no external or cross-dataset validation yet.
- Images are frames from continuous inspection video. The splits were not verified to be video-disjoint, so near-identical frames may appear in different splits and results may be optimistic for unseen track.
- Only the `n` (nano) model size was trained.

---

## 13. Model Comparison

Test-set results for the three detectors trained in this repository (see `../comparison.ipynb`):

| Model | Test images | Precision | Recall | F1 | mAP@50 | mAP@50-95 |
|---|---:|---:|---:|---:|---:|---:|
| **YOLO11n (this folder)** | 310 | 0.477 | 0.406 | 0.439 | 0.400 | 0.144 |
| YOLOv8n | 310 | 0.432 | 0.426 | 0.429 | 0.398 | 0.137 |
| YOLO26n | 300 | 0.434 | 0.376 | 0.403 | 0.375 | 0.136 |

YOLO11n has the highest precision, F1, mAP@50 and mAP@50-95 of the three; YOLOv8n has the highest recall. YOLO26n was evaluated on a 300-image test split (the same 1,494 annotated objects, without 10 object-free images), so the comparison is close but not identical across all three. RF-DETR is planned as a later comparison and is not included in this repository yet.

---

## 14. Reproducibility

```text
Dataset:       Railway Track Surface Faults Dataset v2 → single-class (1 class)
Model:         YOLO11n, pretrained yolo11n.pt
Epochs:        50      Image size: 640      Batch size: 16
Optimizer:     AdamW (auto, lr0 = 0.002)    AMP: enabled
Seed:          0       Deterministic: True  Workers: 2
Ultralytics:   8.4.172 CUDA: 12.8           GPU: Tesla T4
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
