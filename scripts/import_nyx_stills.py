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
    "nyx-portrait.webp": ("nyx-portrait-smoke.png", "nyx-portrait-v2.png"),
    "nyx-walk.webp": ("nyx-walk-smoke.png", "nyx-walk-v2.png"),
    "nyx-wave.webp": ("nyx-wave-smoke.png", "nyx-wave-v2.png"),
    "nyx-chair.webp": ("nyx-chair-smoke.png", "nyx-chair-v2.png"),
    "nyx-sit.webp": ("nyx-sit-smoke.png", "nyx-sit-v2.png"),
    "nyx-pole.webp": ("nyx-pole-smoke.png", "nyx-pole-v2.png"),
    "nyx-hang.webp": ("nyx-hang-smoke.png", "nyx-hang-v2.png"),
    "nyx-floor.webp": ("nyx-floor-smoke.png", "nyx-floor-v2.png"),
    "nyx-climb.webp": ("nyx-climb-smoke.png", "nyx-climb-v2.png"),
}


def pick(smoke_name: str, v2_name: str) -> tuple[Path, bool]:
    smoke = ASSETS / smoke_name
    if smoke.exists() and smoke.stat().st_size > 40_000:
        return smoke, True
    return ASSETS / v2_name, False


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
    for name, (smoke_name, v2_name) in SOURCES.items():
        src, smoked = pick(smoke_name, v2_name)
        im = Image.open(src).convert("RGB")
        if im.size != (1024, 1536):
            im = im.resize((1024, 1536), Image.Resampling.LANCZOS)
        if not smoked:
            im = haze(im)
        dest = DEST / name
        im.save(dest, "WEBP", quality=96, method=6)
        print("still", dest.name, "smoke" if smoked else "haze", im.size, dest.stat().st_size)


if __name__ == "__main__":
    main()
