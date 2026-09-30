# RailGuard

RailGuard is a railway-track image classification research project. It uses a pretrained PyTorch ResNet-18 model to classify track images into eight classes: `Cracks`, `Flakings`, `Grooves`, `Joints`, `Normal`, `Shellings`, `Spallings`, and `Squats`.

The project currently supports dataset preparation, classical image augmentation, configurable training, run logging, checkpoint saving, and basic evaluation. It is a research pipeline, not yet a complete live railway inspection application.

## What is available now

- A prepared eight-class dataset in `data/prepared/railway_defects_8class/` with 5,553 images:
  - `train`: 3,884 images
  - `val`: 830 images
  - `test`: 839 images
- An augmented dataset in `data/experiments/classical_augmentation/railway_defects_8class/` with 6,222 images. Four minority classes are increased to 200 training images.
- Raw source data under `data/raw/`:
  - Surface Faults images: 5,153
  - Kaggle railway images: 798
  - Mendeley YOLO-format images: 7,697
- ResNet-18 training code in `src/training/train_baseline.py`.
- Dataset tools in `src/data/` for preparation, counting, augmentation, and Mendeley label inspection.
- YAML experiment configurations in `configs/`.
- Run-management utilities in `src/utils/run_manager.py`.
- Trained checkpoints in `models/checkpoints/`.
- Confusion matrices, experiment records, visual inspections, and reports in `research/`.

## Current results

The completed run `runs/classical_augmentation/2026-09-29_001/` trained for 15 epochs using ResNet-18 and the classically augmented dataset. Its recorded test results are:

- Test accuracy: `96.78%`
- Macro F1: `94.97%`
- Weighted F1: `96.77%`

The baseline checkpoint and confusion matrix are available, but the original baseline run did not save an exact accuracy or classification report. Those values are therefore not claimed here.

## Repository guide

```text
configs/       Experiment YAML files
data/          Raw, prepared, and augmented datasets
docs/          Research reference PDFs
models/        Trained model checkpoints
research/      Results, audits, images, and experiment registry
runs/          Generated training-run artifacts
scripts/       Validation scripts
src/           Dataset, configuration, training, and run-management code
```

Important files:

- `configs/baseline.yaml` — real-data baseline configuration
- `configs/classical_augmentation.yaml` — augmented-data configuration
- `configs/generated_data.yaml` — planned configuration only; no generated-data experiment exists yet
- `research/experiments/experiment_registry.csv` — experiment history
- `data/README.md` — data layout and provenance
- `models/README.md` — checkpoint details and loading example
- `research/RAILGUARD_PROJECT_AUDIT.md` — detailed repository audit

## Setup

From the repository root:

```bash
pip install -r requirements.txt
```

The main dependencies are PyTorch, torchvision, scikit-learn, Pillow, OpenCV, matplotlib, seaborn, NumPy, and PyYAML.

## Useful commands

Show the prepared dataset counts:

```bash
python src/data/dataset_count.py
```

Recreate the prepared dataset from the raw sources:

```bash
python src/data/prepare_dataset.py
```

Create the classical augmentation dataset:

```bash
python src/data/augment_dataset.py
```

Train with the baseline configuration:

```bash
python src/training/train_baseline.py --config configs/baseline.yaml
```

Train with the classical augmentation configuration:

```bash
python src/training/train_baseline.py --config configs/classical_augmentation.yaml
```

Validate configuration loading and run management:

```bash
python scripts/validate_configs.py
python scripts/validate_run_manager.py
```

Each new training run creates a timestamped directory under `runs/<experiment>/` containing a copied configuration, training log, epoch metrics, model metadata, a classification report, a confusion matrix, and a training curve.

## Not implemented yet

The repository does not currently include a production inference command, video processing, a web dashboard, a backend API, an object-detection training pipeline, or generated/synthetic-data training. The Mendeley data is currently used for inspection and auditing only. These can be added as future work after the classification experiments are complete.

## Project status

RailGuard is an active machine-learning research repository. The classification workflow and experiment artifacts are present and usable. Planned features should be treated as future work until corresponding code and results are added to the repository.
