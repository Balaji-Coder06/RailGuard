# RailGuard

**AI-Based Railway Track Fault Detection, Localization, Severity Assessment and Real-Time Monitoring System**

![Python](https://img.shields.io/badge/Python-3.x-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-ResNet--18-ee4c2c)
![Status](https://img.shields.io/badge/status-active%20research-orange)

RailGuard is a railway-track image classification research project. It fine-tunes a pretrained PyTorch ResNet-18 to classify track images into eight classes: `Cracks`, `Flakings`, `Grooves`, `Joints`, `Normal`, `Shellings`, `Spallings`, and `Squats`.

The repository currently covers dataset preparation, classical image augmentation, configurable training, run logging, checkpointing, and evaluation. It is a research pipeline, not yet a complete live railway inspection application.

---

## Highlights

- Eight-class prepared dataset with a fixed train / val / test split
- Classical augmentation to rebalance minority classes
- YAML-driven experiments, so every run is reproducible from a config file
- Automatic run management: logs, metrics, classification report, confusion matrix, and training curve for each run
- Experiment registry tracking every run in one CSV

## Results

Best completed run: `runs/classical_augmentation/2026-09-29_001/` (ResNet-18, 15 epochs, classically augmented data).

| Metric | Test score |
|---|---|
| Accuracy | **96.78%** |
| Macro F1 | **94.97%** |
| Weighted F1 | **96.77%** |

> The original baseline checkpoint and confusion matrix are included, but that run did not save an exact accuracy or classification report, so no baseline numbers are claimed here.

## Dataset

| Split | Images |
|---|---|
| Train | 3,884 |
| Validation | 830 |
| Test | 839 |
| **Total (prepared)** | **5,553** |

- **Augmented set:** 6,222 images in total. Four minority classes are raised to 200 training images each.
- **Raw sources** (under `data/raw/`):
  - Surface Faults images: 5,153
  - Kaggle railway images: 798
  - Mendeley YOLO-format images: 7,697 (currently used for inspection and auditing only)

See [`data/README.md`](data/README.md) for layout and provenance.

## Repository structure

```
RailGuard/
├── configs/       Experiment YAML files
├── data/          Raw, prepared, and augmented datasets
├── docs/          Research reference PDFs
├── models/        Trained model checkpoints
├── research/      Results, audits, images, and experiment registry
├── runs/          Generated training-run artifacts
├── scripts/       Validation scripts
├── src/           Dataset, config, training, and run-management code
├── requirements.txt
└── README.md
```

Key files:

| File | Purpose |
|---|---|
| `configs/baseline.yaml` | Real-data baseline configuration |
| `configs/classical_augmentation.yaml` | Augmented-data configuration |
| `configs/generated_data.yaml` | Planned config only; no generated-data experiment exists yet |
| `src/training/train_baseline.py` | ResNet-18 training script |
| `src/utils/run_manager.py` | Run directory, logging, and artifact management |
| `research/experiments/experiment_registry.csv` | Experiment history |
| `research/RAILGUARD_PROJECT_AUDIT.md` | Detailed repository audit |
| `models/README.md` | Checkpoint details and loading example |

## Getting started

```bash
git clone https://github.com/Balaji-Coder06/RailGuard.git
cd RailGuard
pip install -r requirements.txt
```

Main dependencies: PyTorch, torchvision, scikit-learn, Pillow, OpenCV, matplotlib, seaborn, NumPy, PyYAML.

## Usage

**Check dataset counts**
```bash
python src/data/dataset_count.py
```

**Rebuild the prepared dataset from raw sources**
```bash
python src/data/prepare_dataset.py
```

**Create the classical augmentation dataset**
```bash
python src/data/augment_dataset.py
```

**Train**
```bash
# Baseline (real data)
python src/training/train_baseline.py --config configs/baseline.yaml

# Classical augmentation
python src/training/train_baseline.py --config configs/classical_augmentation.yaml
```

**Validate configs and run management**
```bash
python scripts/validate_configs.py
python scripts/validate_run_manager.py
```

Each training run creates a timestamped folder under `runs/<experiment>/` containing the copied config, training log, per-epoch metrics, model metadata, classification report, confusion matrix, and training curve.

## Roadmap

Not implemented yet, and should be treated as future work:

- [ ] Comparison of additional classifiers (e.g. EfficientNet-B0, MobileNetV3-Large, DenseNet121, ConvNeXt-Tiny) against the ResNet-18 baseline
- [ ] Generated / synthetic-data training experiments
- [ ] Production inference command
- [ ] Defect localization (object-detection pipeline)
- [ ] Severity assessment
- [ ] Video processing and real-time monitoring
- [ ] Web dashboard and backend API

## Project status

RailGuard is an active machine-learning research repository. The classification workflow and experiment artifacts are present and usable. Planned features are not claimed until the corresponding code and results are in the repo.

## Author

**Balaji** — [@Balaji-Coder06](https://github.com/Balaji-Coder06)

## Acknowledgements

Built using publicly available railway track datasets (Surface Faults, Kaggle, and Mendeley sources). Please check each dataset's own license and citation requirements before reuse.
