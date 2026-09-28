# RailGuard — Railway Track Fault Detection & Monitoring AI

**RailGuard** is an AI-powered railway track inspection and safety monitoring system that automatically classifies railway surface defects using deep convolutional neural networks.

---

## 1. Project Objective

Railway tracks are exposed to extreme dynamic loads, thermal cycles, and environmental wear that produce critical surface defects (squats, flakings, cracks, spallings, etc.). Left undetected, surface defects propagate into internal structural failures and rail breaks.

RailGuard addresses this by applying computer vision and deep learning to automated railway surface defect detection. The repository is structured as a **serious ML research project** — every experiment is fully traceable back to its configuration, dataset, training logs, metrics, checkpoints, and evaluation artifacts.

---

## 2. Repository Architecture

```
RailGuard/
│
├── configs/                               # Experiment configuration files (YAML)
│   ├── baseline.yaml                      # Baseline experiment config
│   ├── classical_augmentation.yaml        # Classical augmentation experiment config
│   └── generated_data.yaml                # Planned: generative AI experiment config
│
├── data/                                  # Datasets (raw → prepared → experiment-derived)
│   ├── raw/                               # Immutable original datasets (never modified)
│   │   ├── kaggle/railway_fault_classification/
│   │   ├── mendeley/rail_defects/
│   │   └── surface_faults/railway_track_surface_faults/
│   ├── prepared/                          # Canonical RailGuard 8-class dataset
│   │   └── railway_defects_8class/
│   │       ├── train/ | val/ | test/
│   └── experiments/                       # Experiment-specific derived datasets
│       ├── classical_augmentation/railway_defects_8class/
│       └── generated_data/                # (planned)
│
├── src/                                   # Source code
│   ├── config/
│   │   └── config_loader.py               # YAML config loading utilities
│   ├── data/                              # Data preparation & auditing
│   │   ├── prepare_dataset.py             # Compiles raw datasets → 8-class split
│   │   ├── augment_dataset.py             # Classical minority-class augmentation
│   │   ├── dataset_count.py               # Class-distribution reporter
│   │   └── dataset_audit.py               # Visual bounding-box auditor
│   ├── training/
│   │   └── train_baseline.py              # ResNet-18 training pipeline (integrated logging)
│   ├── evaluation/                        # (planned)
│   └── utils/
│       └── run_manager.py                 # Run directories, logging, metrics CSV
│
├── models/                                # Model registry & checkpoints
│   ├── checkpoints/                       # Trained .pth files (ignored by git)
│   │   ├── railguard_resnet18_real_baseline.pth
│   │   └── railguard_resnet18_classical_augmented.pth
│   └── README.md
│
├── research/                              # Experimental documentation & results
│   ├── experiments/
│   │   ├── experiment_registry.csv        # Master index of all experiments
│   │   ├── baseline/ | classical_augmentation/ | generated_data/
│   ├── results/
│   │   ├── confusion_matrices/            # Visualised confusion matrices
│   │   ├── classification_reports/        # Precision/recall/F1 reports
│   │   └── training_curves/              # Loss & accuracy plots
│   ├── class_inspection/                  # Visual bounding-box audits
│   └── README.md
│
├── runs/                                  # Timestamped training run artifacts (git-ignored)
│   └── baseline/2026-09-28_001/
│       ├── config.yaml                    # Config snapshot
│       ├── training.log                   # Structured timestamped log
│       ├── metrics.csv                    # Per-epoch train/val metrics
│       ├── model_info.json                # Experiment + checkpoint metadata
│       ├── classification_report.txt
│       ├── confusion_matrix.png
│       └── training_curve.png
│
├── logs/                                  # Persistent application logs (git-ignored)
│   ├── training/
│   ├── inference/
│   └── application/
│
├── docs/                                  # Architecture & research documentation
├── notebooks/                             # Jupyter notebooks (EDA, analysis)
├── tests/                                 # Unit & integration tests
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## 3. Experiment & Run System

Every training run since the new system was introduced produces a fully self-contained **run directory**:

```
runs/<experiment>/<YYYY-MM-DD_NNN>/
    config.yaml                 ← exact config used for this run
    training.log                ← timestamped per-epoch log
    metrics.csv                 ← epoch, train_loss, val_loss, val_accuracy
    model_info.json             ← architecture, dataset, best_epoch, checkpoint path
    classification_report.txt   ← sklearn precision/recall/F1 per class
    confusion_matrix.png        ← heatmap of test predictions
    training_curve.png          ← loss & accuracy curves
```

All runs are indexed in [`research/experiments/experiment_registry.csv`](research/experiments/experiment_registry.csv).

---

## 4. Dataset Organization & 8-Class Taxonomy

### Dataset Sources (`data/raw/`)
| Source | Path | Images | Purpose |
|---|---|---|---|
| Surface Faults | `data/raw/surface_faults/railway_track_surface_faults/` | 5,153 | 7 defect classes |
| Kaggle | `data/raw/kaggle/railway_fault_classification/` | 800 | Normal (non-defective) class |
| Mendeley | `data/raw/mendeley/rail_defects/` | 15,314 files | Bounding-box visual audits |

### 8-Class Taxonomy
| # | Class | Source |
|---|---|---|
| 1 | `Cracks` | Surface Faults |
| 2 | `Flakings` | Surface Faults |
| 3 | `Grooves` | Surface Faults |
| 4 | `Joints` | Surface Faults |
| 5 | `Normal` | Kaggle (non-defective) |
| 6 | `Shellings` | Surface Faults |
| 7 | `Spallings` | Surface Faults |
| 8 | `Squats` | Surface Faults |

### Split Protocol
- **Ratio**: 70% Train / 15% Validation / 15% Test — reproducibility seed: `42`
- **Total**: 5,553 images → 3,884 train / 830 val / 839 test
- **Class weights**: Inverse-frequency weighting to handle class imbalance

---

## 5. Experiment Status

| Experiment | Status | Config | Checkpoint | Notes |
|---|---|---|---|---|
| `baseline` | ✅ Completed | `configs/baseline.yaml` | `railguard_resnet18_real_baseline.pth` | Pre-run-management era; per-epoch metrics not logged |
| `classical_augmentation` | ✅ Completed | `configs/classical_augmentation.yaml` | `railguard_resnet18_classical_augmented.pth` | 4 minority classes augmented to 200 training samples each |
| `generated_data` | 🔄 Planned | `configs/generated_data.yaml` | — | Generative AI / diffusion-based synthetic data |

---

## 6. Quickstart

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Verify Dataset Distribution
```bash
python src/data/dataset_count.py
```

### Reconstruct Prepared Dataset (Reproducibility)
```bash
python src/data/prepare_dataset.py
```

### Run Baseline Training
```bash
python src/training/train_baseline.py
```
Each run automatically creates a timestamped directory under `runs/baseline/` containing the full log, metrics, confusion matrix, and classification report.

---

## 7. Technical Stack

| Component | Technology |
|---|---|
| Deep learning framework | PyTorch ≥ 2.0 |
| CNN backbone | ResNet-18 (ImageNet pretrained) |
| Evaluation metrics | scikit-learn |
| Visualisation | matplotlib, seaborn |
| Image processing | Pillow, OpenCV |
| Configuration | YAML (pyyaml) |

---

## 8. Artifact Registry

- **Checkpoints** → [`models/checkpoints/`](models/checkpoints/) — see [`models/README.md`](models/README.md)
- **Experiment Results** → [`research/results/`](research/results/)
- **Experiment Registry** → [`research/experiments/experiment_registry.csv`](research/experiments/experiment_registry.csv)
- **Data Provenance** → [`data/README.md`](data/README.md)
- **Research Overview** → [`research/README.md`](research/README.md)
