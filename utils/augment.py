"""Offline data augmentation to balance class counts.

Uses standard transformations from the plant-disease literature:
  - random rotations (multiples of 90deg + small jitter)
  - horizontal / vertical flips
  - brightness / contrast jitter
  - small Gaussian noise

Augmented images are saved with an `aug_` prefix so they can be filtered
out for any 'real-only' evaluation.
"""
from __future__ import annotations

import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DATASET = ROOT / "dataset"
SEED = 42


def is_real(p: Path) -> bool:
    return not p.name.startswith("aug_")


def real_images(class_dir: Path):
    return sorted([p for p in class_dir.iterdir()
                   if p.suffix.lower() in {".jpg", ".jpeg", ".png"} and is_real(p)])


def augment_once(img: Image.Image, rng: random.Random) -> Image.Image:
    """Apply a random composition of plant-disease-paper-standard augmentations."""
    if rng.random() < 0.5:
        img = ImageOps.mirror(img)
    if rng.random() < 0.5:
        img = ImageOps.flip(img)
    # rotation: pick a multiple of 90 + small jitter
    base = rng.choice([0, 90, 180, 270])
    jitter = rng.uniform(-10, 10)
    img = img.rotate(base + jitter, resample=Image.BILINEAR, fillcolor=(0, 0, 0))
    # brightness / contrast jitter
    img = ImageEnhance.Brightness(img).enhance(rng.uniform(0.8, 1.2))
    img = ImageEnhance.Contrast(img).enhance(rng.uniform(0.85, 1.15))
    # color saturation
    img = ImageEnhance.Color(img).enhance(rng.uniform(0.85, 1.15))
    # mild gaussian noise
    if rng.random() < 0.5:
        arr = np.asarray(img, dtype=np.float32)
        noise = np.random.normal(0, rng.uniform(2, 6), arr.shape)
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr)
    return img


def balance_class(class_dir: Path, target: int, rng: random.Random):
    reals = real_images(class_dir)
    # remove any pre-existing aug images so re-running is deterministic
    for p in class_dir.iterdir():
        if p.name.startswith("aug_"):
            p.unlink()
    needed = max(0, target - len(reals))
    if needed == 0:
        print(f"  {class_dir.name:25s} reals={len(reals):4d} -> no aug needed")
        return 0
    print(f"  {class_dir.name:25s} reals={len(reals):4d} -> generating {needed} aug images")
    for i in range(needed):
        src = reals[i % len(reals)]
        with Image.open(src) as im:
            im = im.convert("RGB")
            aug = augment_once(im, rng)
        out = class_dir / f"aug_{class_dir.name}_{i:05d}.jpg"
        aug.save(out, "JPEG", quality=88)
    return needed


def main(target_per_class: int = 1500):
    rng = random.Random(SEED)
    np.random.seed(SEED)
    print(f"Balancing all classes to {target_per_class} images each ...")
    total_aug = 0
    for cdir in sorted(DATASET.iterdir()):
        if not cdir.is_dir():
            continue
        total_aug += balance_class(cdir, target_per_class, rng)
    print(f"Total augmented images generated: {total_aug}")


if __name__ == "__main__":
    main()
