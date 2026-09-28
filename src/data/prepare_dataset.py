from pathlib import Path
import random
import shutil

SEED = 42
random.seed(SEED)

ROOT = Path(__file__).resolve().parents[2]

SURFACE = ROOT / "data" / "raw" / "surface_faults" / "railway_track_surface_faults"
KAGGLE = ROOT / "data" / "raw" / "kaggle" / "railway_fault_classification"
OUTPUT = ROOT / "data" / "prepared" / "railway_defects_8class"

CLASSES = [
    "Cracks",
    "Flakings",
    "Grooves",
    "Joints",
    "Shellings",
    "Spallings",
    "Squats",
    "Normal"
]

EXTENSIONS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}

# Create output folders
for split in ["train", "val", "test"]:
    for cls in CLASSES:
        (OUTPUT / split / cls).mkdir(parents=True, exist_ok=True)


def get_images(folder):
    return [
        p for p in folder.rglob("*")
        if p.is_file() and p.suffix in EXTENSIONS
    ]


def split_images(images):
    random.shuffle(images)

    n = len(images)

    train_n = int(n * 0.70)
    val_n = int(n * 0.15)

    train = images[:train_n]
    val = images[train_n:train_n + val_n]
    test = images[train_n + val_n:]

    return train, val, test


def copy_images(images, split, cls):
    for i, src in enumerate(images):
        # Prefix prevents filename collisions
        dst = OUTPUT / split / cls / f"{cls}_{i:05d}{src.suffix.lower()}"
        shutil.copy2(src, dst)


# -------------------------
# Surface Faults dataset
# -------------------------

for cls in CLASSES[:-1]:
    source = SURFACE / cls
    images = get_images(source)

    train, val, test = split_images(images)

    copy_images(train, "train", cls)
    copy_images(val, "val", cls)
    copy_images(test, "test", cls)

    print(
        f"{cls:12} | "
        f"Total: {len(images):4} | "
        f"Train: {len(train):4} | "
        f"Val: {len(val):3} | "
        f"Test: {len(test):3}"
    )


# -------------------------
# Kaggle Normal images
# -------------------------

normal_images = []

for p in KAGGLE.rglob("*"):
    if (
        p.is_file()
        and p.suffix in EXTENSIONS
        and "Non Defective" in str(p)
    ):
        normal_images.append(p)

train, val, test = split_images(normal_images)

copy_images(train, "train", "Normal")
copy_images(val, "val", "Normal")
copy_images(test, "test", "Normal")

print(
    f"{'Normal':12} | "
    f"Total: {len(normal_images):4} | "
    f"Train: {len(train):4} | "
    f"Val: {len(val):3} | "
    f"Test: {len(test):3}"
)

print("\nDataset created successfully!")
print(f"Location: {OUTPUT}")