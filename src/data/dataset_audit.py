from pathlib import Path
from collections import defaultdict
import cv2

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / "data" / "raw" / "mendeley" / "rail_defects"
OUTPUT = ROOT / "research" / "class_inspection"
OUTPUT.mkdir(parents=True, exist_ok=True)

images = {}

for label in DATASET.rglob("*.txt"):
    try:
        lines = label.read_text().splitlines()
    except:
        continue

    ids = set()

    for line in lines:
        parts = line.split()
        if parts:
            ids.add(int(parts[0]))

    image_path = label.parent.parent / "images" / (label.stem + ".jpg")

    if image_path.exists():
        for class_id in ids:
            if class_id not in images:
                images[class_id] = (image_path, label)

print("Found representative images:")
print(images.keys())

for class_id in range(10):

    if class_id not in images:
        print(f"Class {class_id}: NOT FOUND")
        continue

    image_path, label_path = images[class_id]

    img = cv2.imread(str(image_path))

    for line in label_path.read_text().splitlines():

        parts = line.split()

        if len(parts) != 5:
            continue

        cid, xc, yc, w, h = map(float, parts)

        if int(cid) != class_id:
            continue

        H, W = img.shape[:2]

        x1 = int((xc - w / 2) * W)
        y1 = int((yc - h / 2) * H)
        x2 = int((xc + w / 2) * W)
        y2 = int((yc + h / 2) * H)

        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

        cv2.putText(
            img,
            f"CLASS {class_id}",
            (x1, max(y1 - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

    output = OUTPUT / f"class_{class_id}.jpg"
    cv2.imwrite(str(output), img)

    print(f"Class {class_id} -> {output}")

print("\nDONE.")