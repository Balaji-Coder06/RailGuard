"""
src/training/train_baseline.py
================================
RailGuard — ResNet-18 Baseline Training Pipeline.

Trains a ResNet-18 classifier on the 8-class RailGuard prepared dataset
using inverse-frequency class weights and AdamW optimisation.

Usage
-----
    # From the repository root:
    python src/training/train_baseline.py

    # With an explicit config:
    python src/training/train_baseline.py --config configs/baseline.yaml
    python src/training/train_baseline.py --config configs/classical_augmentation.yaml

Run outputs are saved to:
    runs/<experiment_name>/<YYYY-MM-DD_NNN>/
        config.yaml
        training.log
        metrics.csv
        model_info.json
        confusion_matrix.png
        classification_report.txt
        training_curve.png

The best model checkpoint is saved to:
    models/checkpoints/<checkpoint_from_config>.pth
"""

import argparse
import random
import sys
import json
from datetime import datetime
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torchvision.models import ResNet18_Weights

from sklearn.metrics import classification_report, confusion_matrix
import matplotlib
matplotlib.use("Agg")   # Non-interactive backend — safe for logging + server runs
import matplotlib.pyplot as plt
import seaborn as sns

# ---------------------------------------------------------------------------
# Resolve repository root so the script works from any cwd
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from src.utils.run_manager import (
    create_run,
    setup_run_logger,
    append_epoch_metrics,
    finalise_model_info,
    record_experiment_in_registry,
)
from src.config.config_loader import load_config



# =========================
# CONFIG
# =========================

parser = argparse.ArgumentParser(description="RailGuard training pipeline")
parser.add_argument(
    "--config",
    type=str,
    default=str(ROOT / "configs" / "baseline.yaml"),
    help="Path to experiment YAML config (default: configs/baseline.yaml)",
)
args = parser.parse_args()

CONFIG_PATH = Path(args.config)
if not CONFIG_PATH.is_absolute():
    CONFIG_PATH = ROOT / CONFIG_PATH
cfg = load_config(CONFIG_PATH)

EXPERIMENT = cfg["experiment_name"]
DATA_DIR   = ROOT / cfg["dataset"]["path"]
MODEL_DIR  = ROOT / "models" / "checkpoints"
MODEL_PATH = ROOT / cfg["output"]["checkpoint"]

BATCH_SIZE = cfg["training"]["batch_size"]
EPOCHS     = cfg["training"]["epochs"]
LR         = cfg["training"]["learning_rate"]
NUM_WORKERS = cfg["training"]["num_workers"]

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# =========================
# REPRODUCIBILITY
# =========================

SEED = cfg["dataset"]["seed"]
random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)


# =========================
# RUN MANAGEMENT
# =========================

run_dir = create_run(
    experiment_name=EXPERIMENT,
    config_path=CONFIG_PATH,
    root=ROOT,
)

run_id = run_dir.name

log = setup_run_logger(run_dir, EXPERIMENT, run_id)

log.info("=" * 60)
log.info(f"RailGuard Training Run")
log.info(f"Experiment : {EXPERIMENT}")
log.info(f"Run ID     : {run_id}")
log.info(f"Run Dir    : {run_dir}")
log.info(f"Device     : {DEVICE}")
log.info("=" * 60)


# =========================
# DATA
# =========================

train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(
        brightness=0.2,
        contrast=0.2
    ),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

train_data = datasets.ImageFolder(DATA_DIR / "train", transform=train_transform)
val_data   = datasets.ImageFolder(DATA_DIR / "val",   transform=test_transform)
test_data  = datasets.ImageFolder(DATA_DIR / "test",  transform=test_transform)

train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True,  num_workers=NUM_WORKERS)
val_loader   = DataLoader(val_data,   batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
test_loader  = DataLoader(test_data,  batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)

classes = train_data.classes

log.info(f"Dataset    : {DATA_DIR}")
log.info(f"Classes    : {classes}")
log.info(f"Train      : {len(train_data)} images")
log.info(f"Val        : {len(val_data)} images")
log.info(f"Test       : {len(test_data)} images")
log.info(f"Batch size : {BATCH_SIZE}")
log.info(f"Epochs     : {EPOCHS}")
log.info(f"LR         : {LR}")


# =========================
# MODEL
# =========================

weights = ResNet18_Weights.DEFAULT
model = models.resnet18(weights=weights)
num_features = model.fc.in_features
model.fc = nn.Linear(num_features, len(classes))
model = model.to(DEVICE)

log.info(f"Model      : ResNet-18 (pretrained=True, classes={len(classes)})")


# =========================
# CLASS WEIGHTS
# =========================

class_counts = []
for cls in classes:
    count = len(list((DATA_DIR / "train" / cls).glob("*")))
    class_counts.append(count)

total = sum(class_counts)

class_weights = [
    total / (len(classes) * count)
    for count in class_counts
]

class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32).to(DEVICE)

log.info("Class weights (inverse frequency):")
for cls, w in zip(classes, class_weights):
    log.info(f"  {cls}: {w:.4f}")


# =========================
# LOSS + OPTIMIZER
# =========================

criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
optimizer = torch.optim.AdamW(model.parameters(), lr=LR)

log.info(f"Loss       : CrossEntropyLoss (with class weights)")
log.info(f"Optimizer  : AdamW")


# =========================
# TRAINING LOOP
# =========================

best_val_loss     = float("inf")
best_val_accuracy = 0.0
best_epoch        = -1

MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Track metrics for training curve
history = {"epoch": [], "train_loss": [], "val_loss": [], "val_accuracy": []}

log.info("-" * 60)
log.info("Starting training...")
log.info("-" * 60)

for epoch in range(EPOCHS):

    # ---- Train ----
    model.train()
    train_loss = 0

    for images, labels in train_loader:
        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        train_loss += loss.item()

    train_loss /= len(train_loader)

    # ---- Validate ----
    model.eval()
    val_loss   = 0
    correct    = 0
    total_val  = 0

    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            outputs = model(images)
            loss    = criterion(outputs, labels)
            val_loss += loss.item()

            predictions = outputs.argmax(1)
            correct    += (predictions == labels).sum().item()
            total_val  += labels.size(0)

    val_loss     /= len(val_loader)
    val_accuracy  = correct / total_val

    log.info(
        f"Epoch {epoch + 1:02}/{EPOCHS} | "
        f"Train Loss: {train_loss:.4f} | "
        f"Val Loss: {val_loss:.4f} | "
        f"Val Acc: {val_accuracy:.4f}"
    )

    # ---- Record metrics ----
    append_epoch_metrics(run_dir, epoch + 1, train_loss, val_loss, val_accuracy)

    history["epoch"].append(epoch + 1)
    history["train_loss"].append(train_loss)
    history["val_loss"].append(val_loss)
    history["val_accuracy"].append(val_accuracy)

    # ---- Checkpoint ----
    if val_loss < best_val_loss:
        best_val_loss     = val_loss
        best_val_accuracy = val_accuracy
        best_epoch        = epoch + 1

        torch.save(model.state_dict(), MODEL_PATH)
        log.info(f"  ✓ Best checkpoint saved (epoch {best_epoch}): {MODEL_PATH}")


log.info("-" * 60)
log.info(f"Training complete. Best epoch: {best_epoch}, Val Loss: {best_val_loss:.4f}, Val Acc: {best_val_accuracy:.4f}")


# =========================
# TRAINING CURVE
# =========================

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

ax1.plot(history["epoch"], history["train_loss"], label="Train Loss", marker="o", markersize=3)
ax1.plot(history["epoch"], history["val_loss"],   label="Val Loss",   marker="o", markersize=3)
ax1.set_xlabel("Epoch")
ax1.set_ylabel("Loss")
ax1.set_title("Loss Curves")
ax1.legend()
ax1.grid(True, alpha=0.3)

ax2.plot(history["epoch"], history["val_accuracy"], label="Val Accuracy", color="green", marker="o", markersize=3)
ax2.set_xlabel("Epoch")
ax2.set_ylabel("Accuracy")
ax2.set_title("Validation Accuracy")
ax2.legend()
ax2.grid(True, alpha=0.3)

fig.suptitle(f"RailGuard — {EXPERIMENT} ({run_id})", fontsize=12)
plt.tight_layout()

training_curve_path = run_dir / "training_curve.png"
plt.savefig(training_curve_path, dpi=150)
plt.close(fig)
log.info(f"Training curve saved: {training_curve_path}")


# =========================
# TEST EVALUATION
# =========================

log.info("Loading best checkpoint for test evaluation...")

model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()

all_predictions = []
all_labels = []

with torch.no_grad():
    for images, labels in test_loader:
        images = images.to(DEVICE)
        outputs = model(images)
        predictions = outputs.argmax(1)
        all_predictions.extend(predictions.cpu().numpy())
        all_labels.extend(labels.numpy())


# =========================
# CLASSIFICATION REPORT & METRICS
# =========================

report_str = classification_report(
    all_labels,
    all_predictions,
    target_names=classes,
    zero_division=0
)
report_dict = classification_report(
    all_labels,
    all_predictions,
    target_names=classes,
    zero_division=0,
    output_dict=True
)

test_accuracy = float(report_dict["accuracy"])
macro_f1      = float(report_dict["macro avg"]["f1-score"])
weighted_f1   = float(report_dict["weighted avg"]["f1-score"])

log.info("\n" + "=" * 40)
log.info(f"RAILGUARD {EXPERIMENT.upper()} RESULTS")
log.info("=" * 40)
log.info("\n" + report_str)
log.info(f"Test Accuracy : {test_accuracy:.4f}")
log.info(f"Macro F1      : {macro_f1:.4f}")
log.info(f"Weighted F1   : {weighted_f1:.4f}")

report_path = run_dir / "classification_report.txt"
report_path.write_text(
    f"RailGuard — {EXPERIMENT} | Run: {run_id}\n"
    f"Evaluated: {datetime.now().isoformat(timespec='seconds')}\n"
    f"Test Accuracy: {test_accuracy:.4f} | Macro F1: {macro_f1:.4f} | Weighted F1: {weighted_f1:.4f}\n\n"
    + report_str,
    encoding="utf-8"
)
log.info(f"Classification report saved: {report_path}")


# =========================
# CONFUSION MATRIX (run dir)
# =========================

cm = confusion_matrix(all_labels, all_predictions)

plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt="d", xticklabels=classes, yticklabels=classes)
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title(f"RailGuard — {EXPERIMENT} ({run_id})")
plt.tight_layout()

cm_run_path = run_dir / "confusion_matrix.png"
plt.savefig(cm_run_path, dpi=300)
plt.close()
log.info(f"Confusion matrix saved: {cm_run_path}")

# Also save to research/results for the canonical research archive
research_cm_dir = ROOT / "research" / "results" / "confusion_matrices"
research_cm_dir.mkdir(parents=True, exist_ok=True)
research_cm_path = research_cm_dir / f"{EXPERIMENT}_confusion_matrix.png"
import shutil
shutil.copy2(cm_run_path, research_cm_path)
log.info(f"Confusion matrix copied to research archive: {research_cm_path}")


# =========================
# MODEL INFO JSON
# =========================

finalise_model_info(
    run_dir=run_dir,
    experiment=EXPERIMENT,
    run_id=run_id,
    architecture="ResNet18",
    dataset_path=DATA_DIR,
    num_classes=len(classes),
    classes=classes,
    training_epochs=EPOCHS,
    best_epoch=best_epoch,
    checkpoint_path=MODEL_PATH,
    best_val_loss=best_val_loss,
    best_val_accuracy=best_val_accuracy,
    test_accuracy=test_accuracy,
    macro_f1=macro_f1,
    weighted_f1=weighted_f1,
)
log.info(f"Model info saved: {run_dir / 'model_info.json'}")


# =========================
# EXPERIMENT REGISTRY
# =========================

rel_checkpoint = str(MODEL_PATH.relative_to(ROOT)).replace("\\", "/")
record_experiment_in_registry(
    run_id=run_id,
    experiment=EXPERIMENT,
    date=datetime.now().strftime("%Y-%m-%d"),
    model="ResNet18",
    dataset=cfg["dataset"].get("name", DATA_DIR.name),
    train_images=len(train_data),
    validation_images=len(val_data),
    test_images=len(test_data),
    epochs=EPOCHS,
    best_epoch=best_epoch,
    test_accuracy=test_accuracy,
    macro_f1=macro_f1,
    checkpoint=rel_checkpoint,
    status="completed",
    notes=f"Experiment: {EXPERIMENT}. Run: {run_id}. Weighted F1: {weighted_f1:.4f}.",
    root=ROOT,
)
log.info(f"Experiment registry updated: {ROOT / 'research' / 'experiments' / 'experiment_registry.csv'}")

log.info("=" * 60)
log.info(f"Run complete: {run_dir}")
log.info("=" * 60)