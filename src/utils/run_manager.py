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
    (run_dir / "model_info.json").write_text(
        json.dumps(info, indent=4), encoding="utf-8"
    )
