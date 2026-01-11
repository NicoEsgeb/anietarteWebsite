#!/usr/bin/env python3
"""
Utility to regenerate gallery JSON data from the local resources folders.
"""

import json
from pathlib import Path
from typing import Dict, List

BASE_DIR = Path(__file__).resolve().parent.parent
RESOURCES_DIR = BASE_DIR / "resources"
OBJECTS_DIR = RESOURCES_DIR / "imagesObjects"
PEOPLE_DIR = RESOURCES_DIR / "imagesPeople"
DATA_DIR = BASE_DIR / "data"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def list_image_files(folder: Path) -> List[Path]:
    return sorted(
        [
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTS
        ]
    )


def build_objects_payload() -> List[Dict]:
    payload: List[Dict] = []
    for category_dir in sorted(OBJECTS_DIR.iterdir()):
        if not category_dir.is_dir():
            continue

        items = []
        for img in list_image_files(category_dir):
            rel_path = img.relative_to(BASE_DIR).as_posix()
            alt_text = f"{category_dir.name} - {img.stem}"
            items.append({"src": rel_path, "alt": alt_text})

        if items:
            payload.append({"category": category_dir.name, "items": items})

    return payload


def build_people_payload() -> List[Dict]:
    prefix_groups = [
        ("groupSelfie", "Group Selfie"),
        ("groupWorking", "Group Working"),
        ("objectCreated", "Objects in Progress"),
        ("personShowingTheirObjectCreated", "People with Their Creations"),
    ]
    grouped: Dict[str, List[Dict]] = {label: [] for _, label in prefix_groups}
    others: List[Dict] = []

    for img in list_image_files(PEOPLE_DIR):
        rel_path = img.relative_to(BASE_DIR).as_posix()
        group_label = None

        for prefix, label in prefix_groups:
            if img.name.startswith(prefix):
                group_label = label
                break

        if group_label:
            grouped[group_label].append({"src": rel_path, "alt": group_label})
        else:
            others.append({"src": rel_path, "alt": img.stem})

    payload = []
    for _, label in prefix_groups:
        items = grouped.get(label, [])
        if items:
            payload.append({"group": label, "items": items})

    if others:
        payload.append({"group": "Otros", "items": others})

    return payload


def save_json(path: Path, payload: List[Dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    objects_payload = build_objects_payload()
    people_payload = build_people_payload()

    save_json(DATA_DIR / "objects.json", objects_payload)
    save_json(DATA_DIR / "people.json", people_payload)

    print(f"Wrote {len(objects_payload)} object categories to data/objects.json")
    print(f"Wrote {len(people_payload)} people groups to data/people.json")


if __name__ == "__main__":
    main()
