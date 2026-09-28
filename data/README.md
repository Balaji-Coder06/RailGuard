# RailGuard - Data Architecture & Directory Guide

This document describes the dataset directory structure, dataset provenance, split protocols, and experimental dataset management for the **RailGuard** AI railway defect detection project.

---

## Directory Overview

```
data/
├── raw/
│   ├── kaggle/
│   │   └── railway_fault_classification/
│   │       ├── Train/
│   │       ├── Validation/
│   │       └── Test/
│   ├── mendeley/
│   │   └── rail_defects/
│   │       ├── train/
│   │       ├── valid/
│   │       └── test/
│   └── surface_faults/
│       └── railway_track_surface_faults/
│           ├── Cracks/
│           ├── Flakings/
│           ├── Grooves/
│           ├── Joints/
│           ├── Shellings/
│           ├── Spallings/
│           └── Squats/
│
├── prepared/
│   └── railway_defects_8class/
│       ├── train/
│       ├── val/
│       └── test/
│
└── experiments/
    └── classical_augmentation/
        └── railway_defects_8class/
            ├── train/
            ├── val/
            └── test/
```

---

## 1. `raw/` - Original Source Datasets

> **CRITICAL RULE**: The datasets in `raw/` are immutable primary sources. They must remain completely untouched, unedited, and unaltered.

The `raw/` directory preserves the original downloaded datasets in their native form:

- **`raw/kaggle/railway_fault_classification/`**
  - **Source**: Kaggle Railway Fault Classification dataset.
  - **Structure**: Partitioned into `Train/`, `Validation/`, and `Test/` with `Defective/` and `Non Defective/` subdirectories.
  - **Role in RailGuard**: Source for non-defective railway track imagery mapped to the **Normal** class in the RailGuard classifier.

- **`raw/mendeley/rail_defects/`**
  - **Source**: Mendeley Data Rail Defects Detection dataset (YOLOv8 format).
  - **Structure**: Subdivided into `train/`, `valid/`, and `test/` splits containing bounding-box annotations (`labels/`) and source imagery (`images/`).
  - **Role in RailGuard**: Used for class audit, bounding box inspection, and defect localization research.

- **`raw/surface_faults/railway_track_surface_faults/`**
  - **Source**: Railway Track Surface Faults Dataset.
  - **Structure**: Subfolders corresponding to 7 surface defect classes: `Cracks/`, `Flakings/`, `Grooves/`, `Joints/`, `Shellings/`, `Spallings/`, and `Squats/`.
  - **Role in RailGuard**: Primary source for railway surface defect imagery.

---

## 2. `prepared/` - Canonical RailGuard 8-Class Classifier Dataset

The `prepared/` directory contains processed datasets created specifically for standard model training and evaluation in RailGuard.

### Dataset: `railway_defects_8class`
Constructed by [`src/data/prepare_dataset.py`](../src/data/prepare_dataset.py) by merging:
1. The 7 defect categories from `raw/surface_faults/railway_track_surface_faults/`
2. The `Non Defective` track images from `raw/kaggle/railway_fault_classification/` mapped to the `Normal` category.

### The 8 Classification Classes:
1. `Cracks`
2. `Flakings`
3. `Grooves`
4. `Joints`
5. `Normal`
6. `Shellings`
7. `Spallings`
8. `Squats`

### Splitting Methodology & Reproducibility:
- **Split Ratio**: 70% Train, 15% Validation, 15% Test
- **Random Seed**: `42` (`random.seed(42)`)
- **Isolation**: Filenames are prepended with the class name and index (e.g., `Cracks_00000.jpg`) to avoid collisions.

### Sample Counts:
- **Train**: 3,884 images
- **Val**: 830 images
- **Test**: 839 images
- **Total**: 5,553 images

---

## 3. `experiments/` - Derived & Experimental Datasets

> **ISOLATION PRINCIPLE**: Experimental and augmented datasets must remain completely separated from `prepared/` to ensure fair, unbiased, and reproducible benchmarks.

The `experiments/` directory stores derived data produced for specific hypothesis tests or data balancing interventions.

### Experiment: `classical_augmentation/railway_defects_8class`
- **Script**: [`src/data/augment_dataset.py`](../src/data/augment_dataset.py)
- **Base Source**: `data/prepared/railway_defects_8class`
- **Methodology**:
  - The validation (`val/`) and test (`test/`) sets are **strictly preserved** (identical to `prepared/railway_defects_8class`, 830 val and 839 test images).
  - Classical image augmentations (Rotation ±7°, RandomAffine translation & scaling, ColorJitter, Gaussian Blur) are applied **only to the training set (`train/`)**.
  - Under-represented defect classes in the training set are augmented to reach a target count of 200 images each:
    - `Cracks`: 28 real → 200 total (172 augmented)
    - `Grooves`: 5 real → 200 total (195 augmented)
    - `Joints`: 7 real → 200 total (193 augmented)
    - `Shellings`: 91 real → 200 total (109 augmented)
- **Sample Counts**:
  - **Train**: 4,553 images (3,884 real + 669 augmented)
  - **Val**: 830 images (untouched)
  - **Test**: 839 images (untouched)
  - **Total**: 6,222 images

---

## Distinction: Raw vs. Derived Data

| Aspect | `data/raw/` | `data/prepared/` | `data/experiments/` |
|---|---|---|---|
| **Mutability** | **Read-only** | Derived / Regenerable via script | Experimental / Isolated |
| **Generation Script** | N/A (External Downloads) | `prepare_dataset.py` | `augment_dataset.py` |
| **Class Taxonomy** | Varies by source | Fixed 8-class taxonomy | Fixed 8-class taxonomy |
| **Split Structure** | Varies by dataset | Standardized 70 / 15 / 15 | Inherited test/val, augmented train |
