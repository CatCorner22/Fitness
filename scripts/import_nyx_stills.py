#!/usr/bin/env python3
"""Import identity-locked photoreal Nyx stills as high-quality WebP."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path("/workspace")
DEST = ROOT / "public/instructor"
SOURCES = {
    "nyx-portrait.webp": Path("/opt/cursor/artifacts/assets/nyx-portrait-v2.png"),
    "nyx-walk.webp": Path("/opt/cursor/artifacts/assets/nyx-walk-v2.png"),
    "nyx-wave.webp": Path("/opt/cursor/artifacts/assets/nyx-wave-v2.png"),
    "nyx-chair.webp": Path("/opt/cursor/artifacts/assets/nyx-chair-v2.png"),
    "nyx-sit.webp": Path("/opt/cursor/artifacts/assets/nyx-sit-v2.png"),
    "nyx-pole.webp": Path("/opt/cursor/artifacts/assets/nyx-pole-v2.png"),
    "nyx-hang.webp": Path("/opt/cursor/artifacts/assets/nyx-hang-v2.png"),
}


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for name, src in SOURCES.items():
        im = Image.open(src).convert("RGB")
        if im.size != (1024, 1536):
            im = im.resize((1024, 1536), Image.Resampling.LANCZOS)
        dest = DEST / name
        im.save(dest, "WEBP", quality=96, method=6)
        print("still", dest.name, im.size, dest.stat().st_size)


if __name__ == "__main__":
    main()
