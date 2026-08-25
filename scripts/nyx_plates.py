#!/usr/bin/env python3
"""Illustrated topless Nyx plates (Pillow). Fashion-poster style, adult figure."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path("/workspace/public/instructor/plates")
OUT.mkdir(parents=True, exist_ok=True)

W, H = 720, 1280
BG = (18, 16, 13)
SKIN = (232, 199, 176)
SKIN2 = (210, 164, 140)
HAIR = (8, 8, 10)
PANTS = (12, 12, 16)
LIPS = (42, 12, 20)
COPPER = (224, 122, 61)
MUTED = (201, 192, 176)
POLE = (198, 206, 214)
NIPPLE = (196, 130, 118)


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


def canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    # vignette
    overlay = Image.new("RGB", (W, H), (42, 32, 24))
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((-80, -40, W + 80, 820), fill=90)
    mask = mask.filter(ImageFilter.GaussianBlur(80))
    im = Image.composite(overlay, im, mask)
    d = ImageDraw.Draw(im)
    return im, d


def draw_pole(d: ImageDraw.ImageDraw, x: int = 140) -> None:
    d.rounded_rectangle((x, 150, x + 20, 1180), 10, fill=POLE)
    d.rectangle((x + 6, 150, x + 10, 1180), fill=(240, 244, 246))


def draw_hair(d: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0) -> None:
    s = scale
    d.ellipse((cx - 58 * s, cy - 70 * s, cx + 58 * s, cy + 20 * s), fill=HAIR)
    d.ellipse((cx - 78 * s, cy - 10 * s, cx - 8 * s, cy + 150 * s), fill=HAIR)
    d.ellipse((cx + 8 * s, cy - 10 * s, cx + 78 * s, cy + 150 * s), fill=HAIR)
    d.polygon(
        [
            (cx - 50 * s, cy - 8 * s),
            (cx, cy - 28 * s),
            (cx + 50 * s, cy - 8 * s),
            (cx + 36 * s, cy + 18 * s),
            (cx, cy - 2 * s),
            (cx - 36 * s, cy + 18 * s),
        ],
        fill=HAIR,
    )


def draw_face(d: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0) -> None:
    s = scale
    d.ellipse((cx - 42 * s, cy - 48 * s, cx + 42 * s, cy + 52 * s), fill=SKIN)
    draw_hair(d, cx, cy - 8 * s, s)
    # eyes
    for dx in (-16, 16):
        d.ellipse((cx + (dx - 8) * s, cy - 2 * s, cx + (dx + 8) * s, cy + 8 * s), fill=(26, 18, 16))
        d.ellipse((cx + (dx - 3) * s, cy + 1 * s, cx + (dx + 4) * s, cy + 7 * s), fill=(210, 220, 228))
        d.ellipse((cx + (dx - 1.5) * s, cy + 2.5 * s, cx + (dx + 2.2) * s, cy + 6.2 * s), fill=HAIR)
        d.arc(
            (cx + (dx - 12) * s, cy - 10 * s, cx + (dx + 12) * s, cy + 6 * s),
            200,
            340,
            fill=HAIR,
            width=max(2, int(3 * s)),
        )
    # septum
    d.arc((cx - 6 * s, cy + 12 * s, cx + 6 * s, cy + 24 * s), 20, 160, fill=POLE, width=2)
    # lips
    d.ellipse((cx - 12 * s, cy + 22 * s, cx + 12 * s, cy + 34 * s), fill=LIPS)


def draw_torso(d: ImageDraw.ImageDraw, cx: int, top: int, waist: int) -> None:
    d.polygon(
        [
            (cx - 46, top + 20),
            (cx - 38, waist),
            (cx + 38, waist),
            (cx + 46, top + 20),
            (cx + 22, top),
            (cx - 22, top),
        ],
        fill=SKIN,
    )
    # breasts
    d.ellipse((cx - 52, top + 28, cx - 2, top + 88), fill=SKIN)
    d.ellipse((cx + 2, top + 28, cx + 52, top + 88), fill=SKIN)
    d.ellipse((cx - 36, top + 62, cx - 18, top + 80), fill=NIPPLE)
    d.ellipse((cx + 18, top + 62, cx + 36, top + 80), fill=NIPPLE)


def draw_pants(d: ImageDraw.ImageDraw, points: list[tuple[int, int]]) -> None:
    d.polygon(points, fill=PANTS)


def caption(d: ImageDraw.ImageDraw, title: str) -> None:
    d.text((36, 36), "NYX  ·  STAGE LAB", fill=COPPER, font=font(18))
    d.text((36, 68), title, fill=(244, 239, 230), font=font(34))
    d.text((36, 1236), "Fictional adult instructor  ·  illustrated plate", fill=(120, 112, 102), font=font(14))


def save(im: Image.Image, name: str) -> None:
    path = OUT / name
    im.save(path, "PNG", optimize=True)
    print("wrote", path, path.stat().st_size)


def plate_portrait() -> None:
    im, d = canvas()
    draw_pole(d, 520)
    d.ellipse((210, 1148, 510, 1210), fill=(0, 0, 0))
    draw_torso(d, 340, 390, 690)
    draw_pants(d, [(302, 680), (378, 680), (410, 1160), (270, 1160)])
    d.line((292, 430, 240, 860), fill=SKIN2, width=28)
    d.line((388, 430, 500, 320), fill=SKIN2, width=28)
    draw_face(d, 340, 300, 1.15)
    caption(d, "Instructor")
    save(im, "nyx-plate-portrait.png")


def plate_walk() -> None:
    im, d = canvas()
    draw_pole(d, 110)
    d.ellipse((240, 1156, 620, 1220), fill=(0, 0, 0))
    draw_torso(d, 400, 400, 700)
    draw_pants(d, [(362, 690), (444, 700), (510, 1160), (400, 1150), (340, 980), (350, 780)])
    d.line((354, 440, 200, 820), fill=SKIN2, width=26)
    d.line((446, 430, 600, 560), fill=SKIN2, width=26)
    draw_face(d, 400, 310, 1.05)
    caption(d, "Performance walk")
    save(im, "nyx-plate-walk.png")


def plate_wave() -> None:
    im, d = canvas()
    draw_pole(d, 560)
    draw_torso(d, 350, 430, 720)
    draw_pants(d, [(312, 710), (400, 720), (430, 1160), (290, 1150)])
    d.line((304, 500, 180, 740), fill=SKIN2, width=26)
    d.line((398, 470, 520, 640), fill=SKIN2, width=26)
    draw_face(d, 360, 330, 1.08)
    caption(d, "Body wave")
    save(im, "nyx-plate-wave.png")


def plate_floor() -> None:
    im, d = canvas()
    draw_pole(d, 70)
    d.ellipse((120, 980, 680, 1140), fill=(22, 20, 17))
    d.ellipse((250, 700, 520, 900), fill=SKIN)
    d.ellipse((300, 760, 360, 828), fill=SKIN)
    d.ellipse((370, 752, 430, 820), fill=SKIN)
    d.ellipse((314, 792, 332, 810), fill=NIPPLE)
    d.ellipse((384, 784, 402, 802), fill=NIPPLE)
    draw_pants(d, [(240, 850), (360, 920), (430, 1100), (280, 1100), (210, 940)])
    d.line((250, 780, 140, 940), fill=SKIN2, width=24)
    d.line((500, 790, 630, 860), fill=SKIN2, width=24)
    draw_face(d, 430, 640, 0.95)
    caption(d, "Floorwork")
    save(im, "nyx-plate-floor.png")


def plate_chair() -> None:
    im, d = canvas()
    draw_pole(d, 560)
    d.rectangle((250, 700, 470, 830), fill=(58, 44, 34))
    d.rectangle((250, 820, 470, 838), fill=(48, 36, 28))
    d.rectangle((262, 838, 282, 1060), fill=(42, 32, 24))
    d.rectangle((438, 838, 458, 1060), fill=(42, 32, 24))
    draw_torso(d, 360, 430, 720)
    draw_pants(d, [(322, 710), (410, 720), (500, 980), (240, 980)])
    d.line((314, 500, 170, 700), fill=SKIN2, width=24)
    d.line((406, 500, 560, 640), fill=SKIN2, width=24)
    draw_face(d, 360, 330, 1.05)
    caption(d, "Chair phrase")
    save(im, "nyx-plate-chair.png")


def plate_sit() -> None:
    im, d = canvas()
    draw_pole(d, 350)
    draw_torso(d, 360, 400, 690)
    draw_pants(d, [(320, 680), (430, 700), (500, 1080), (400, 1040), (340, 1080), (250, 1060)])
    d.line((318, 450, 250, 300), fill=SKIN2, width=26)
    d.line((404, 450, 490, 300), fill=SKIN2, width=26)
    draw_face(d, 368, 300, 1.02)
    caption(d, "Pole sit")
    save(im, "nyx-plate-sit.png")


if __name__ == "__main__":
    plate_portrait()
    plate_walk()
    plate_wave()
    plate_floor()
    plate_chair()
    plate_sit()
