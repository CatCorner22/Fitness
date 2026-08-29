#!/usr/bin/env python3
"""Import Nyx nude/topless look sets into public/instructor as 1024×1536 WebP."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path("/tmp/nyx-edit/out")
DEST = ROOT / "public/instructor"
SIZE = (1024, 1536)

# key -> (source filename in SRC, mode)
# mode: "fit" letterbox-crop to 2:3, "close" tighter face/chest crop
JOBS: list[tuple[str, str, str]] = [
    # Standing nude — three poses
    ("nuda", "nuda.png", "fit"),
    ("nudb", "nudb.png", "fit"),
    ("nudc", "nudc.png", "fit"),
    # Chair nude
    ("ncha", "ncha.png", "fit"),
    ("nchb", "nchb.png", "fit"),
    ("nchd", "ncha.png", "close"),
    # Floor nude
    ("nrea", "nrea.png", "fit"),
    ("nreb", "nreb.png", "fit"),
    ("nrec", "nrec.png", "fit"),
    # Pole nude (nplb is the fireman/high-arm still)
    ("npla", "npla.png", "fit"),
    ("nplb", "nchc.png", "fit"),
    ("nplc", "nplc.png", "fit"),
    # Topless in pants
    ("ntpa", "ntpa.png", "fit"),
    ("ntpb", "ntpb.png", "fit"),
    ("ntpc", "ntpc.png", "fit"),
    # Heels-only nude
    ("nhea", "nhea.png", "fit"),
    ("nheb", "nheb.png", "fit"),
    ("nhec", "nheb.png", "close"),
]


def to_portrait(im: Image.Image, close: bool = False) -> Image.Image:
    im = im.convert("RGB")
    if close:
        w, h = im.size
        box = (int(w * 0.10), 0, int(w * 0.90), int(h * 0.64))
        im = im.crop(box)
    w, h = im.size
    target = 2 / 3
    ratio = w / h
    if ratio > target + 0.01:
        nw = int(h * target)
        left = max(0, (w - nw) // 2)
        im = im.crop((left, 0, left + nw, h))
    elif ratio < target - 0.01:
        nh = int(w / target)
        top = max(0, (h - nh) // 6)  # bias up so faces stay in frame
        im = im.crop((0, top, w, min(h, top + nh)))
    return im.resize(SIZE, Image.Resampling.LANCZOS)


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for key, src_name, mode in JOBS:
        src = SRC / src_name
        if not src.exists():
            raise SystemExit(f"missing source {src}")
        im = to_portrait(Image.open(src), close=(mode == "close"))
        dest = DEST / f"nyx-{key}.webp"
        im.save(dest, "WEBP", quality=96, method=6)
        print(f"{dest.name} {im.size} {dest.stat().st_size}")


if __name__ == "__main__":
    main()
