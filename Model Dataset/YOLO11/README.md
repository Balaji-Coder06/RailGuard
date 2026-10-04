# YOLO11 Railway Defect Detection

## Overview

YOLO11 was trained for binary railway track defect detection using the Mendeley Railway Defects Detection dataset.

The model performs object detection and identifies regions containing railway defects using bounding boxes.

The current system uses a single detection class:

- `defect`

---

## Dataset

### Source

Mendeley Data:

https://data.mendeley.com/datasets/88sh5y3tmj/2

### Dataset format

YOLO object detection format.

### Dataset split

| Split | Images | Label Files |
|---|---:|---:|
| Train | 6781 | 6656 |
| Validation | 606 | 600 |
| Test | 310 | 297 |

Some images contain no annotations and are therefore treated as background images.

---

## Dataset Preparation

The original dataset contained multiple railway defect classes.

For the current RailGuard implementation, the classes were converted into a binary detection task:

```text
0: defect