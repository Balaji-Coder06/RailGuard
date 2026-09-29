"""
src/utils/run_manager.py
=========================
Manages timestamped training run directories for RailGuard experiments.

Each call to create_run() creates a structured run directory:

    runs/<experiment_name>/<timestamp>/
        config.yaml
        training.log
        metrics.csv
        model_info.json
        classification_report.txt
        confusion_matrix.png
        training_curve.png

Usage
-----
    from src.utils.run_manager import create_run

    run_dir = create_run(experiment_name="baseline", config_path="configs/baseline.yaml")
    # → returns Path to the run directory, e.g. runs/baseline/2026-09-28_001/
"""

from __future__ import annotations

import csv
import json
import logging
import shutil
from datetime import datetime
from pathlib import Path


# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------

def _next_run_id(experiment_dir: Path, date_str: str) -> str:
    """
    Return a run ID of the form YYYY-MM-DD_NNN, where NNN is
    auto-incremented to avoid collisions within the same day.
    """
    existing = [
        d.name for d in experiment_dir.iterdir()
        if d.is_dir() and d.name.startswith(date_str)
    ] if experiment_dir.exists() else []

    suffixes = []
    for name in existing:
        parts = name.split("_")
        if len(parts) == 4:          # YYYY-MM-DD_NNN
            try:
                suffixes.append(int(parts[3]))
            except ValueError:
                pass

    next_num = max(suffixes, default=0) + 1
    return f"{date_str}_{next_num:03d}"


# -----------------------------------------------------------------------
# Public API
# -----------------------------------------------------------------------

def create_run(
    experiment_name: str,
    config_path: str | Path,
    root: Path | None = None,
) -> Path:
    """
    Create a timestamped run directory for the given experiment.

    Parameters
    ----------
    experiment_name : str
        Name of the experiment (e.g. "baseline", "classical_augmentation").
    config_path : str or Path
        Path to the experiment's YAML config file.
    root : Path, optional
        Repository root. Defaults to three levels above this file.

    Returns
    -------
    Path
        Path to the newly created run directory.
    """
    if root is None:
        root = Path(__file__).resolve().parents[2]

    config_path = Path(config_path)
    date_str = datetime.now().strftime("%Y-%m-%d")

    experiment_dir = root / "runs" / experiment_name
    experiment_dir.mkdir(parents=True, exist_ok=True)

    run_id = _next_run_id(experiment_dir, date_str)
    run_dir = experiment_dir / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    # Copy config snapshot into run directory
    if config_path.exists():
        shutil.copy2(config_path, run_dir / "config.yaml")

    # Initialise an empty metrics CSV with correct headers
    metrics_path = run_dir / "metrics.csv"
    if not metrics_path.exists():
        with metrics_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=["epoch", "train_loss", "val_loss", "val_accuracy"]
            )
            writer.writeheader()

    # Create a placeholder model_info.json
    model_info_path = run_dir / "model_info.json"
    if not model_info_path.exists():
        info = {
            "experiment": experiment_name,
            "run_id": run_id,
            "status": "initialized",
            "created_at": datetime.now().isoformat(timespec="seconds"),
        }
        model_info_path.write_text(
            json.dumps(info, indent=4), encoding="utf-8"
        )

    return run_dir


def setup_run_logger(
    run_dir: Path,
    experiment_name: str,
    run_id: str,
) -> logging.Logger:
    """
    Configure and return a logger that writes to:
      - <run_dir>/training.log  (file handler)
      - stdout                  (stream handler)

    Parameters
    ----------
    run_dir : Path
        The run directory returned by create_run().
    experiment_name : str
        Used in the logger name for disambiguation.
    run_id : str
        Used in the logger name for disambiguation.

    Returns
    -------
    logging.Logger
    """
    logger_name = f"railguard.{experiment_name}.{run_id}"
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)

    # Avoid duplicate handlers if called more than once
    if logger.handlers:
        return logger

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # File handler
    log_path = run_dir / "training.log"
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    return logger


def append_epoch_metrics(
    run_dir: Path,
    epoch: int,
    train_loss: float,
    val_loss: float,
    val_accuracy: float,
) -> None:
    """
    Append one epoch's metrics to <run_dir>/metrics.csv.

    Parameters
    ----------
    run_dir : Path
        Run directory (as returned by create_run).
    epoch : int
        1-based epoch number.
    train_loss : float
    val_loss : float
    val_accuracy : float
    """
    metrics_path = run_dir / "metrics.csv"
    with metrics_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["epoch", "train_loss", "val_loss", "val_accuracy"]
        )
        writer.writerow({
            "epoch": epoch,
            "train_loss": round(train_loss, 6),
            "val_loss": round(val_loss, 6),
            "val_accuracy": round(val_accuracy, 6),
        })


def finalise_model_info(
    run_dir: Path,
    experiment: str,
    run_id: str,
    architecture: str,
    dataset_path: str,
    num_classes: int,
    classes: list[str],
    training_epochs: int,
    best_epoch: int,
    checkpoint_path: str,
    best_val_loss: float | None = None,
    best_val_accuracy: float | None = None,
    test_accuracy: float | None = None,
    macro_f1: float | None = None,
    weighted_f1: float | None = None,
) -> None:
    """
    Write the final model_info.json for a completed training run.

    Parameters
    ----------
    run_dir : Path
    experiment : str
    run_id : str
    architecture : str
    dataset_path : str
    num_classes : int
    classes : list[str]
    training_epochs : int
    best_epoch : int
    checkpoint_path : str
    best_val_loss : float, optional
    best_val_accuracy : float, optional
    test_accuracy : float, optional
    macro_f1 : float, optional
    weighted_f1 : float, optional
    """
    info = {
        "experiment": experiment,
        "run_id": run_id,
        "architecture": architecture,
        "dataset": str(dataset_path),
        "num_classes": num_classes,
        "classes": classes,
        "training_epochs": training_epochs,
        "best_epoch": best_epoch,
        "checkpoint": str(checkpoint_path),
        "status": "completed",
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }
    if best_val_loss is not None:
        info["best_val_loss"] = round(best_val_loss, 6)
    if best_val_accuracy is not None:
        info["best_val_accuracy"] = round(best_val_accuracy, 6)
    if test_accuracy is not None:
        info["test_accuracy"] = round(test_accuracy, 6)
    if macro_f1 is not None:
        info["macro_f1"] = round(macro_f1, 6)
    if weighted_f1 is not None:
        info["weighted_f1"] = round(weighted_f1, 6)

    (run_dir / "model_info.json").write_text(
        json.dumps(info, indent=4), encoding="utf-8"
    )


def record_experiment_in_registry(
    run_id: str,
    experiment: str,
    date: str,
    model: str,
    dataset: str,
    train_images: int,
    validation_images: int,
    test_images: int,
    epochs: int,
    best_epoch: int,
    test_accuracy: float,
    macro_f1: float,
    checkpoint: str,
    status: str = "completed",
    notes: str = "",
    root: Path | None = None,
) -> Path:
    """
    Append or update an experiment record in research/experiments/experiment_registry.csv.

    Parameters
    ----------
    run_id : str
    experiment : str
    date : str
    model : str
    dataset : str
    train_images : int
    validation_images : int
    test_images : int
    epochs : int
    best_epoch : int
    test_accuracy : float
    macro_f1 : float
    checkpoint : str
    status : str, optional
    notes : str, optional
    root : Path, optional

    Returns
    -------
    Path
        Path to the updated experiment_registry.csv.
    """
    if root is None:
        root = Path(__file__).resolve().parents[2]

    registry_path = root / "research" / "experiments" / "experiment_registry.csv"
    registry_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "run_id", "experiment", "date", "model", "dataset",
        "train_images", "validation_images", "test_images",
        "epochs", "best_epoch", "test_accuracy", "macro_f1",
        "checkpoint", "status", "notes"
    ]

    new_row = {
        "run_id": run_id,
        "experiment": experiment,
        "date": date,
        "model": model,
        "dataset": dataset,
        "train_images": str(train_images),
        "validation_images": str(validation_images),
        "test_images": str(test_images),
        "epochs": str(epochs),
        "best_epoch": str(best_epoch),
        "test_accuracy": f"{test_accuracy:.4f}" if isinstance(test_accuracy, (int, float)) else str(test_accuracy),
        "macro_f1": f"{macro_f1:.4f}" if isinstance(macro_f1, (int, float)) else str(macro_f1),
        "checkpoint": checkpoint,
        "status": status,
        "notes": notes,
    }

    rows: list[dict[str, str]] = []
    if registry_path.exists():
        with registry_path.open("r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

    # If run_id already exists, update it; otherwise insert before planned rows or append
    inserted = False
    for idx, r in enumerate(rows):
        if r.get("run_id") == run_id:
            rows[idx] = new_row
            inserted = True
            break
        if not r.get("run_id") and r.get("status") == "planned":
            rows.insert(idx, new_row)
            inserted = True
            break

    if not inserted:
        rows.append(new_row)

    with registry_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return registry_path

