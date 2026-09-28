from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / "data" / "prepared" / "railway_defects_8class"

EXTENSIONS = {".jpg", ".jpeg", ".png"}

print("=" * 70)
print("DATASET REPORT")
print("=" * 70)

grand_total = 0

for split in ["train", "val", "test"]:

    split_path = DATASET / split

    if not split_path.exists():
        continue

    print(f"\n[{split.upper()}]")
    print("-" * 40)

    split_total = 0

    for class_folder in sorted(split_path.iterdir()):

        if not class_folder.is_dir():
            continue

        count = sum(
            1
            for p in class_folder.rglob("*")
            if p.is_file()
            and p.suffix.lower() in EXTENSIONS
        )

        print(f"{class_folder.name:20} {count:5}")

        split_total += count

    print("-" * 40)
    print(f"{'Split total':20} {split_total:5}")

    grand_total += split_total


print("\n" + "=" * 70)
print(f"TOTAL DATASET IMAGES: {grand_total}")
print("=" * 70)