# RailGuard - Trained Models & Checkpoints

This directory houses trained neural network weights, checkpoint metadata, and model artifacts for the RailGuard project.

---

## Directory Layout

```
models/
├── checkpoints/
│   ├── railguard_resnet18_real_baseline.pth
│   ├── railguard_resnet18_classical_augmented.pth
│   ├── railguard_baseline_resnet18.pth           # Legacy alias for real baseline
│   └── railguard_augmented_resnet18.pth          # Legacy alias for augmented model
└── README.md
```

---

## Model Inventory & Provenance

### 1. `railguard_resnet18_real_baseline.pth`
- **Architecture**: PyTorch `torchvision.models.resnet18` (initialized with `ResNet18_Weights.DEFAULT` and linear classification head adapted for 8 classes).
- **Training Dataset**: Real-data 8-class canonical prepared dataset (`data/prepared/railway_defects_8class/train`).
- **Input Resolution**: 224 × 224 pixels.
- **Loss Function**: `CrossEntropyLoss` with inverse class-frequency weights to account for class imbalance.
- **Optimizer**: `AdamW` (learning rate: 1e-4, batch size: 32).
- **Target Classes**: 8 (`Cracks`, `Flakings`, `Grooves`, `Joints`, `Normal`, `Shellings`, `Spallings`, `Squats`).
- **File Size**: ~44.8 MB.

### 2. `railguard_resnet18_classical_augmented.pth`
- **Architecture**: PyTorch `torchvision.models.resnet18` (8-class classification head).
- **Training Dataset**: Classical augmentation dataset (`data/experiments/classical_augmentation/railway_defects_8class/train`), where under-represented defect classes (`Cracks`, `Grooves`, `Joints`, `Shellings`) were augmented to 200 samples each.
- **Evaluation**: Evaluated against the untouched validation (`830` images) and test (`839` images) sets.
- **File Size**: ~44.8 MB.

### Legacy Aliases (Preserved for Backward Compatibility)
- **`railguard_baseline_resnet18.pth`**: Equivalent to `railguard_resnet18_real_baseline.pth`.
- **`railguard_augmented_resnet18.pth`**: Equivalent to `railguard_resnet18_classical_augmented.pth`.

---

## Loading a Checkpoint

```python
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT_PATH = ROOT / "models" / "checkpoints" / "railguard_resnet18_real_baseline.pth"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.resnet18()
model.fc = nn.Linear(model.fc.in_features, 8)
model.load_state_dict(torch.load(CHECKPOINT_PATH, map_location=device))
model.to(device)
model.eval()
```
