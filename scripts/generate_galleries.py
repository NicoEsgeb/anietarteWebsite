#!/usr/bin/env python3
"""Utility to regenerate gallery JSON data from the local resources folders."""

import json
from pathlib import Path
from typing import Dict, List

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def find_repo_root() -> Path:
    """Walk upward from this file until we find the repo root (identified by /resources)."""
    start = Path(__file__).resolve().parent
    for candidate in [start, *start.parents]:
        if (candidate / "resources").is_dir():
            return candidate
    raise FileNotFoundError("Could not find repository root containing 'resources' directory.")


def list_image_files(folder: Path) -> List[Path]:
    if not folder.is_dir():
        return []
    return sorted(
        [path for path in folder.iterdir() if path.is_file() and path.suffix.lower() in IMAGE_EXTS],
        key=lambda path: path.name.casefold(),
    )


def build_objects_payload(objects_dir: Path, base_dir: Path) -> List[Dict]:
    if not objects_dir.is_dir():
        return []

    payload: List[Dict] = []
    for category_dir in sorted(objects_dir.iterdir(), key=lambda path: path.name.casefold()):
        if not category_dir.is_dir():
            continue

        items = []
        for img in list_image_files(category_dir):
            rel_path = img.relative_to(base_dir).as_posix()
            alt_text = f"{category_dir.name} - {img.stem}"
            items.append({"src": rel_path, "alt": alt_text})

        if items:
            payload.append({"category": category_dir.name, "items": items})

    return payload


def build_people_payload(people_dir: Path, base_dir: Path) -> List[Dict]:
    if not people_dir.is_dir():
        return []

    # Prefer grouping by subfolders so adding a new folder automatically creates a new section.
    subfolders = sorted(
        [path for path in people_dir.iterdir() if path.is_dir()],
        key=lambda path: path.name.casefold(),
    )
    if subfolders:
        payload: List[Dict] = []

        # Images sitting directly under imagesPeople still get included as their own group.
        root_items = []
        for img in list_image_files(people_dir):
            rel_path = img.relative_to(base_dir).as_posix()
            alt_text = f"{people_dir.name} - {img.stem}"
            root_items.append({"src": rel_path, "alt": alt_text})
        if root_items:
            payload.append({"group": people_dir.name, "items": root_items})

        for group_dir in subfolders:
            items = []
            for img in list_image_files(group_dir):
                rel_path = img.relative_to(base_dir).as_posix()
                alt_text = f"{group_dir.name} - {img.stem}"
                items.append({"src": rel_path, "alt": alt_text})

            if items:
                payload.append({"group": group_dir.name, "items": items})

        return payload

    # Fallback: legacy prefix-based grouping for when there are no subfolders yet.
    prefix_groups = [
        ("groupSelfie", "Fotos del grupo"),
        ("groupWorking", "Trabajando juntas"),
        ("objectCreated", "Nuestras creaciones"),
        ("personShowingTheirObjectCreated", "Alumnas y su arte"),
    ]
    grouped: Dict[str, List[Dict]] = {label: [] for _, label in prefix_groups}
    others: List[Dict] = []

    for img in list_image_files(people_dir):
        rel_path = img.relative_to(base_dir).as_posix()
        group_label = None

        for prefix, label in prefix_groups:
            if img.name.startswith(prefix):
                group_label = label
                break

        entry = {"src": rel_path, "alt": group_label or img.stem}

        if group_label:
            grouped[group_label].append(entry)
        else:
            others.append(entry)

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


def build_home_payload(home_dir: Path, base_dir: Path) -> Dict:
  """Return hero images for the landing page."""
  images = list_image_files(home_dir)
  items = []
  for img in images:
      rel_path = img.relative_to(base_dir).as_posix()
      items.append({"src": rel_path, "alt": img.stem})
  return {"heroImages": items}


def main() -> None:
    repo_root = find_repo_root()
    resources_dir = repo_root / "resources"
    objects_dir = resources_dir / "imagesObjects"
    people_dir = resources_dir / "imagesPeople"
    home_dir = resources_dir / "imagesInicio"
    data_dir = repo_root / "data"

    objects_payload = build_objects_payload(objects_dir, repo_root)
    people_payload = build_people_payload(people_dir, repo_root)
    home_payload = build_home_payload(home_dir, repo_root)

    save_json(data_dir / "objects.json", objects_payload)
    save_json(data_dir / "people.json", people_payload)
    save_json(data_dir / "home.json", home_payload)

    print(f"Wrote {len(objects_payload)} object categories to data/objects.json")
    print(f"Wrote {len(people_payload)} people groups to data/people.json")
    print(f"Wrote {len(home_payload.get('heroImages', []))} hero images to data/home.json")


if __name__ == "__main__":
    main()
