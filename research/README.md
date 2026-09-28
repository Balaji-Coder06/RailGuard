# RailGuard - Research & Experimental Artifacts

This directory contains experimental documentation, evaluation outputs, visual audits, research results, and the experiment registry for the RailGuard project.

---

## Directory Architecture

```
research/
├── experiments/
│   ├── experiment_registry.csv            # Master index of all conducted experiments
│   ├── baseline/                          # Notes/docs for baseline experiment
│   ├── classical_augmentation/            # Notes/docs for augmentation experiment
│   └── generated_data/                    # Future: synthetic data experiment
│
├── results/
│   ├── confusion_matrices/                # Visualised confusion matrices
│   │   └── baseline_confusion_matrix.png
│   ├── classification_reports/            # Precision/recall/F1 text reports
│   ├── training_curves/                   # Loss and accuracy plots
│   └── comparisons/                       # Cross-experiment comparisons
│
├── class_inspection/                      # Visual bounding-box audits (Mendeley)
│   └── class_0.jpg ... class_9.jpg
│
└── README.md
```

---

## Experiment Registry

The master experiment index is kept at:

**[`research/experiments/experiment_registry.csv`](experiments/experiment_registry.csv)**

Each row records one completed (or planned) training run:

| Column | Description |
|---|---|
| `run_id` | Unique run identifier |
| `experiment` | Experiment name (matches `configs/` and `runs/`) |
| `date` | Date experiment was run |
| `model` | Model architecture |
| `dataset` | Dataset name |
| `train_images` | Training set size |
| `validation_images` | Validation set size |
| `test_images` | Test set size |
| `epochs` | Epochs trained |
| `best_epoch` | Epoch where best checkpoint was saved |
| `test_accuracy` | Test set accuracy |
| `macro_f1` | Macro-averaged F1 score |
| `checkpoint` | Path to saved model checkpoint |
| `status` | `completed` / `planned` / `failed` |
| `notes` | Experiment-specific notes |

> **Note**: The two legacy experiments (`legacy-baseline-001`, `legacy-augmented-001`) were trained before the run-management system existed. Their per-epoch metrics and exact accuracy values were not logged at time of training and are recorded as `unknown`. From future training runs onwards, all values will be auto-populated by the training pipeline.

---

## Completed Experiments

### 1. Real-Data Baseline (`legacy-baseline-001`)
- **Experiment**: `baseline`
- **Config**: [`configs/baseline.yaml`](../configs/baseline.yaml)
- **Dataset**: `data/prepared/railway_defects_8class` (5,553 images, 70/15/15 split)
- **Model**: ResNet-18 (pretrained ImageNet, 8-class head)
- **Training**: 15 epochs, AdamW (lr=1e-4), CrossEntropyLoss with inverse-frequency class weights
- **Checkpoint**: `models/checkpoints/railguard_resnet18_real_baseline.pth`
- **Confusion Matrix**: [`research/results/confusion_matrices/baseline_confusion_matrix.png`](results/confusion_matrices/baseline_confusion_matrix.png)
- **Status**: ✅ Completed (metrics not logged — pre-run-management era)

### 2. Classical Augmentation (`legacy-augmented-001`)
- **Experiment**: `classical_augmentation`
- **Config**: [`configs/classical_augmentation.yaml`](../configs/classical_augmentation.yaml)
- **Dataset**: `data/experiments/classical_augmentation/railway_defects_8class` (6,222 images)
- **Augmentation**: Minority classes (`Cracks`, `Grooves`, `Joints`, `Shellings`) augmented to 200 training samples each via offline affine/photometric transforms.
- **Model**: ResNet-18 (pretrained ImageNet, 8-class head)
- **Checkpoint**: `models/checkpoints/railguard_resnet18_classical_augmented.pth`
- **Status**: ✅ Completed (metrics not logged — pre-run-management era)

### 3. Generated Data (`planned`)
- **Experiment**: `generated_data`
- **Config**: [`configs/generated_data.yaml`](../configs/generated_data.yaml)
- **Status**: 🔄 Planned — Not yet implemented

---

## Reproducibility Chain

From the next training run onwards, every experiment follows this traceable chain:

```
Config (configs/<experiment>.yaml)
    ↓
Run Directory (runs/<experiment>/<YYYY-MM-DD_NNN>/)
    ├── config.yaml             (snapshot of config at run time)
    ├── training.log            (timestamped structured log)
    ├── metrics.csv             (per-epoch train/val metrics)
    ├── classification_report.txt
    ├── confusion_matrix.png
    ├── training_curve.png
    └── model_info.json         (experiment + checkpoint metadata)
    ↓
Checkpoint (models/checkpoints/<checkpoint>.pth)
    ↓
Experiment Registry (research/experiments/experiment_registry.csv)
```

---

## Class Inspection (`research/class_inspection/`)

Visual bounding-box audits produced by [`src/data/dataset_audit.py`](../src/data/dataset_audit.py) over the Mendeley Rail Defects (YOLOv8-format) dataset.

Files: `class_0.jpg` through `class_9.jpg` — each showing a representative image with annotated bounding boxes for the corresponding Mendeley label class.
