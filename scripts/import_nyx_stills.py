#!/usr/bin/env python3
"""Import identity-locked photoreal Nyx stills as high-quality WebP.

Prefers smoky studio plates. Falls back to v2 stills with a haze overlay
when a smoke source is missing.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path("/workspace")
DEST = ROOT / "public/instructor"
ASSETS = Path("/opt/cursor/artifacts/assets")

SOURCES = {
    "nyx-portrait.webp": ("nyx-portrait-alluring.png", "nyx-portrait-smoke.png"),
    "nyx-walk.webp": ("nyx-walk-sexy.png", "nyx-walk-smoke.png"),
    "nyx-wave.webp": ("nyx-wave-sexy.png", "nyx-wave-smoke.png"),
    "nyx-chair.webp": ("nyx-chair-sexy.png", "nyx-chair-smoke.png"),
    "nyx-sit.webp": ("nyx-sit-sexy.png", "nyx-sit-smoke.png"),
    "nyx-pole.webp": ("nyx-pole-sexy.png", "nyx-pole-smoke.png"),
    "nyx-hang.webp": ("nyx-hang-sexy.png", "nyx-hang-smoke.png"),
    "nyx-floor.webp": ("nyx-floor-sexy.png", "nyx-floor-smoke.png"),
    "nyx-climb.webp": ("nyx-climb-sexy.png", "nyx-climb-smoke.png"),
}


def pick(preferred: str, fallback: str) -> tuple[Path, bool]:
    first = ASSETS / preferred
    if first.exists() and first.stat().st_size > 40_000:
        return first, True
    return ASSETS / fallback, True


def haze(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    cool = Image.new("RGB", im.size, (36, 34, 42))
    fog = Image.new("RGB", im.size, (118, 114, 124))
    misted = Image.blend(im, cool, 0.16)
    misted = Image.blend(misted, fog, 0.12)
    misted = ImageEnhance.Contrast(misted).enhance(0.94)
    misted = ImageEnhance.Color(misted).enhance(0.92)
    return misted.filter(ImageFilter.GaussianBlur(radius=0.35))


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for name, (preferred_name, fallback_name) in SOURCES.items():
        src, preferred = pick(preferred_name, fallback_name)
        im = Image.open(src).convert("RGB")
        if im.size != (1024, 1536):
            im = im.resize((1024, 1536), Image.Resampling.LANCZOS)
        if not preferred:
            im = haze(im)
        dest = DEST / name
        im.save(dest, "WEBP", quality=96, method=6)
        print("still", dest.name, "preferred" if preferred else "haze", im.size, dest.stat().st_size)


if __name__ == "__main__":
    main()
