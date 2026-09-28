from pathlib import Path
import random
import shutil

from PIL import Image
from torchvision import transforms


SEED = 42
random.seed(SEED)

ROOT = Path(__file__).resolve().parents[2]

SOURCE = ROOT / "data" / "prepared" / "railway_defects_8class"
OUTPUT = ROOT / "data" / "experiments" / "classical_augmentation" / "railway_defects_8class"

TARGETS = {
    "Cracks": 200,
    "Grooves": 200,
    "Joints": 200,
    "Shellings": 200
}

EXTENSIONS = {".jpg", ".jpeg", ".png"}


# -------------------------
# Create output structure
# -------------------------

for split in ["train", "val", "test"]:
    for cls in SOURCE.joinpath(split).iterdir():
        if cls.is_dir():
            (OUTPUT / split / cls.name).mkdir(
                parents=True,
                exist_ok=True
            )


# -------------------------
# Copy original dataset
# -------------------------

print("Copying original dataset...")

for split in ["train", "val", "test"]:

    for cls_dir in (SOURCE / split).iterdir():

        if not cls_dir.is_dir():
            continue

        destination = OUTPUT / split / cls_dir.name

        for image in cls_dir.iterdir():

            if image.suffix.lower() in EXTENSIONS:
                shutil.copy2(
                    image,
                    destination / image.name
                )


# -------------------------
# Augmentation pipeline
# -------------------------

augment = transforms.Compose([
    transforms.RandomRotation(
        degrees=7
    ),

    transforms.RandomAffine(
        degrees=0,
        translate=(0.04, 0.04),
        scale=(0.95, 1.05)
    ),

    transforms.ColorJitter(
        brightness=0.15,
        contrast=0.15,
        saturation=0.10
    ),

    transforms.RandomApply(
        [transforms.GaussianBlur(
            kernel_size=3,
            sigma=(0.1, 1.0)
        )],
        p=0.20
    )
])


# -------------------------
# Generate augmentations
# -------------------------

for cls, target_count in TARGETS.items():

    source_dir = SOURCE / "train" / cls
    output_dir = OUTPUT / "train" / cls

    originals = [
        p for p in source_dir.iterdir()
        if p.suffix.lower() in EXTENSIONS
    ]

    current_count = len(originals)

    needed = max(
        0,
        target_count - current_count
    )

    print(
        f"{cls}: "
        f"{current_count} real → "
        f"{target_count} total "
        f"({needed} augmented)"
    )

    for i in range(needed):

        source = random.choice(originals)

        image = Image.open(source).convert("RGB")

        augmented = augment(image)

        output_name = (
            f"aug_{cls.lower()}_{i:04d}.jpg"
        )

        augmented.save(
            output_dir / output_name,
            quality=95
        )


print("\nExperiment 2A dataset created!")
print(f"Location: {OUTPUT}")