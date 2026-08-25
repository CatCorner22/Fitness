#!/usr/bin/env python3
"""Editorial plates: photoreal Nyx stills with STAGE LAB type. Never draws a figure."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/workspace")
STILLS = ROOT / "public/instructor"
OUT = STILLS / "plates"
OUT.mkdir(parents=True, exist_ok=True)

COPPER = (227, 138, 74)
CREAM = (244, 239, 230)
MUTED = (186, 176, 164)

PLATES: list[tuple[str, str, str]] = [
    ("nyx-portrait.webp", "nyx-plate-portrait.webp", "Instructor"),
    ("nyx-walk.webp", "nyx-plate-walk.webp", "Performance walk"),
    ("nyx-wave.webp", "nyx-plate-wave.webp", "Body wave"),
    ("nyx-walk.webp", "nyx-plate-floor.webp", "Floorwork"),
    ("nyx-chair.webp", "nyx-plate-chair.webp", "Chair phrase"),
    ("nyx-sit.webp", "nyx-plate-sit.webp", "Pole sit"),
    ("nyx-pole.webp", "nyx-plate-pole.webp", "On the pole"),
    ("nyx-hang.webp", "nyx-plate-hang.webp", "Hang"),
]


def font(size: int) -> ImageFont.ImageFont:
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def shade(im: Image.Image, y0: int, y1: int, top_alpha: int, bot_alpha: int) -> None:
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    height = max(1, y1 - y0)
    for i in range(height):
        t = i / height
        a = int(top_alpha + (bot_alpha - top_alpha) * t)
        draw.line((0, y0 + i, im.width, y0 + i), fill=(8, 6, 5, a))
    im.alpha_composite(overlay)


def plate(src_name: str, dest_name: str, title: str) -> None:
    src = Image.open(STILLS / src_name).convert("RGBA")
    w, h = src.size
    shade(src, 0, int(h * 0.22), 170, 0)
    shade(src, int(h * 0.86), h, 0, 200)
    draw = ImageDraw.Draw(src)
    draw.text((36, 32), "NYX  ·  STAGE LAB", fill=COPPER, font=font(22))
    draw.text((36, 64), title, fill=CREAM, font=font(42))
    draw.text(
        (36, h - 48),
        "Fictional adult instructor  ·  photoreal plate",
        fill=MUTED,
        font=font(16),
    )
    out = src.convert("RGB")
    dest = OUT / dest_name
    out.save(dest, "WEBP", quality=94, method=6)
    print("plate", dest.name, dest.stat().st_size)


def main() -> None:
    for src, dest, title in PLATES:
        plate(src, dest, title)


if __name__ == "__main__":
    main()
