#!/usr/bin/env python3
"""Editorial plates: photoreal Nyx stills with STAGE LAB type. Never draws a figure."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
STILLS = ROOT / "public/instructor"
OUT = STILLS / "plates"
OUT.mkdir(parents=True, exist_ok=True)

COPPER = (227, 138, 74)
CREAM = (244, 239, 230)
MUTED = (186, 176, 164)

TITLES: dict[str, str] = {
    "portrait": "Instructor",
    "walk": "Performance walk",
    "wave": "Body wave",
    "floor": "Floorwork",
    "climb": "Climb",
    "chair": "Chair phrase",
    "sit": "Pole sit",
    "pole": "On the pole",
    "hang": "Hang",
    "heels": "Heel walk",
    "hands": "Hands",
    "mermaid": "Mermaid sit",
    "fireman": "High arm",
    "kick": "Fan kick",
    "grind": "Hip phrase",
    "crawl": "Floor crawl",
    "peel": "Costume layer",
    "turn": "Balance turn",
    "nuda": "Standing nude A",
    "nudb": "Standing nude B",
    "nudc": "Standing nude C",
    "ncha": "Chair nude A",
    "nchb": "Chair nude B",
    "nchd": "Chair nude C",
    "nrea": "Floor nude A",
    "nreb": "Floor nude B",
    "nrec": "Floor nude C",
    "npla": "Pole nude A",
    "nplb": "Pole nude B",
    "nplc": "Pole nude C",
    "ntpa": "Topless A",
    "ntpb": "Topless B",
    "ntpc": "Topless C",
    "nhea": "Heels nude A",
    "nheb": "Heels nude B",
    "nhec": "Heels nude C",
}


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
        "Fictional adult instructor  ·  smoky photoreal plate",
        fill=MUTED,
        font=font(16),
    )
    out = src.convert("RGB")
    dest = OUT / dest_name
    out.save(dest, "WEBP", quality=94, method=6)
    print("plate", dest.name, dest.stat().st_size)


def main() -> None:
    stills = sorted(p for p in STILLS.glob("nyx-*.webp") if p.is_file())
    if not stills:
        raise SystemExit("no nyx stills")
    for still in stills:
        key = still.stem.removeprefix("nyx-")
        title = TITLES.get(key, key)
        plate(still.name, f"nyx-plate-{key}.webp", title)


if __name__ == "__main__":
    main()
