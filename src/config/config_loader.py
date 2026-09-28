"""
src/config/config_loader.py
============================
Loads and validates RailGuard experiment configuration files (YAML).

Usage
-----
    from src.config.config_loader import load_config
    cfg = load_config("configs/baseline.yaml")
    print(cfg["experiment_name"])
"""

from pathlib import Path
import yaml


def load_config(config_path: str | Path) -> dict:
    """
    Load a YAML configuration file and return it as a dict.

    Parameters
    ----------
    config_path : str or Path
        Path to the YAML config file.

    Returns
    -------
    dict
        Parsed configuration.

    Raises
    ------
    FileNotFoundError
        If the config file does not exist.
    yaml.YAMLError
        If the YAML cannot be parsed.
    """
    path = Path(config_path)

    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")

    with path.open("r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    if cfg is None:
        raise ValueError(f"Config file is empty: {path}")

    return cfg


def get_dataset_path(cfg: dict, root: Path) -> Path:
    """
    Resolve the dataset path from config relative to project root.

    Parameters
    ----------
    cfg : dict
        Loaded configuration dict.
    root : Path
        Repository root directory.

    Returns
    -------
    Path
        Absolute path to the dataset directory.
    """
    rel_path = cfg.get("dataset", {}).get("path", "")
    if not rel_path:
        raise KeyError("Config missing: dataset.path")
    return root / rel_path


def get_checkpoint_path(cfg: dict, root: Path) -> Path:
    """
    Resolve the model checkpoint output path from config.

    Parameters
    ----------
    cfg : dict
        Loaded configuration dict.
    root : Path
        Repository root directory.

    Returns
    -------
    Path
        Absolute path to the checkpoint file.
    """
    rel_path = cfg.get("output", {}).get("checkpoint", "")
    if not rel_path:
        raise KeyError("Config missing: output.checkpoint")
    return root / rel_path
