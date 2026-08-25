#!/usr/bin/env python3
"""Generate Nyx spoken audio (edge-tts) and Ken Burns clips muxed with that voice."""

from __future__ import annotations

import asyncio
import re
import subprocess
from pathlib import Path

ROOT = Path("/workspace")
COURSE = ROOT / "src/lib/course"
AUDIO = ROOT / "public/instructor/audio"
VIDEO = ROOT / "public/instructor/video"
STILL_DIR = ROOT / "public/instructor"
AUDIO.mkdir(parents=True, exist_ok=True)
VIDEO.mkdir(parents=True, exist_ok=True)

PHOTO = {
    "walk": "nyx-walk.webp",
    "eyeline": "nyx-portrait.webp",
    "arms": "nyx-portrait.webp",
    "wave": "nyx-wave.webp",
    "hip8": "nyx-walk.webp",
    "pulse": "nyx-walk.webp",
    "chest": "nyx-portrait.webp",
    "seated-hips": "nyx-chair.webp",
    "chair-approach": "nyx-chair.webp",
    "chair-roll": "nyx-chair.webp",
    "descent": "nyx-floor.webp",
    "tabletop": "nyx-floor.webp",
    "knee-circle": "nyx-floor.webp",
    "floor-roll": "nyx-floor.webp",
    "layers": "nyx-portrait.webp",
    "eight-count": "nyx-walk.webp",
    "show-run": "nyx-walk.webp",
    "pole-walk": "nyx-pole.webp",
    "back-to-pole": "nyx-sit.webp",
    "fireman": "nyx-sit.webp",
    "hook": "nyx-sit.webp",
    "sit": "nyx-sit.webp",
    "climb": "nyx-climb.webp",
    "descent-pole": "nyx-climb.webp",
    "tuck": "nyx-sit.webp",
    "hang": "nyx-hang.webp",
    "capacity": "nyx-walk.webp",
    "pullup": "nyx-hang.webp",
    "inverted-row": "nyx-hang.webp",
    "repeat-hang": "nyx-hang.webp",
    "hanging-tuck": "nyx-hang.webp",
    "pole-squat": "nyx-pole.webp",
    "heels": "nyx-walk.webp",
    "hands": "nyx-portrait.webp",
    "stage-map": "nyx-walk.webp",
    "shimmy": "nyx-portrait.webp",
    "grind": "nyx-chair.webp",
    "crawl": "nyx-floor.webp",
    "mermaid": "nyx-floor.webp",
    "ladder": "nyx-floor.webp",
    "floor-grind": "nyx-floor.webp",
    "reverse-chair": "nyx-chair.webp",
    "lap-phrase": "nyx-chair.webp",
    "skirt": "nyx-walk.webp",
    "peel": "nyx-portrait.webp",
    "heel-floor": "nyx-floor.webp",
    "rail": "nyx-walk.webp",
    "two-song": "nyx-walk.webp",
    "close": "nyx-walk.webp",
    "recovery": "nyx-portrait.webp",
    "ankle-prep": "nyx-walk.webp",
    "table-edge": "nyx-floor.webp",
    "fan-kick": "nyx-walk.webp",
    "jacket-peel": "nyx-portrait.webp",
    "pirouette": "nyx-walk.webp",
    "tip-tray": "nyx-walk.webp",
    "olh": "nyx-hang.webp",
    "carousel": "nyx-pole.webp",
    "climb-to-sit": "nyx-climb.webp",
    "back-hook": "nyx-sit.webp",
}


def parse_scripts() -> dict[str, str]:
    out: dict[str, str] = {}
    for path in sorted(COURSE.glob("*.ts")):
        text = path.read_text()
        for block in re.split(r"\n  skill\(\{", text)[1:]:
            m_id = re.search(r'id: "([^"]+)"', block)
            m_voice = re.search(r'voiceScript:\s*\n\s*"([^"]+)"', block)
            if m_id and m_voice:
                out[m_id.group(1)] = m_voice.group(1)
    return out


async def tts(skill_id: str, script: str) -> Path:
    import edge_tts

    dest = AUDIO / f"{skill_id}.mp3"
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    dest.unlink(missing_ok=True)
    last_err: Exception | None = None
    for attempt in range(4):
        try:
            comm = edge_tts.Communicate(
                script,
                voice="en-US-AriaNeural",
                rate="-12%",
                pitch="-6Hz",
            )
            await comm.save(str(dest))
            if dest.exists() and dest.stat().st_size > 1000:
                print("audio", dest.name, dest.stat().st_size)
                return dest
        except Exception as err:  # noqa: BLE001
            last_err = err
            dest.unlink(missing_ok=True)
            await asyncio.sleep(1.5 * (attempt + 1))
    print("tts fallback silence", skill_id, last_err)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-t",
            "8",
            "-q:a",
            "9",
            str(dest),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return dest


def ken_burns(src: Path, dest: Path, seconds: float) -> None:
    frames = max(25, int(seconds * 25))
    vf = (
        f"scale=720:1280:force_original_aspect_ratio=increase,"
        f"crop=720:1280,"
        f"zoompan=z='min(zoom+0.0014,1.12)':d={frames}:s=720x1280:fps=25,"
        f"format=yuv420p"
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-i",
            str(src),
            "-vf",
            vf,
            "-t",
            str(seconds),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-an",
            str(dest),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def audio_seconds(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    try:
        return max(4.0, float(out))
    except ValueError:
        return 8.0


def mux(silent: Path, audio: Path, dest: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(silent),
            "-i",
            str(audio),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-shortest",
            str(dest),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("video", dest.name, dest.stat().st_size)


async def main() -> None:
    scripts = parse_scripts()
    print("skills", len(scripts))
    sem = asyncio.Semaphore(3)

    async def one(sid: str, script: str) -> None:
        async with sem:
            audio = await tts(sid, script)
            still_name = PHOTO.get(sid, "nyx-portrait.webp")
            still = STILL_DIR / still_name
            if not still.exists():
                still = STILL_DIR / "nyx-portrait.webp"
            seconds = audio_seconds(audio) + 0.4
            silent = VIDEO / f"_silent_{sid}.mp4"
            ken_burns(still, silent, seconds)
            mux(silent, audio, VIDEO / f"{sid}.mp4")
            silent.unlink(missing_ok=True)

    await asyncio.gather(*(one(sid, sc) for sid, sc in scripts.items()))


if __name__ == "__main__":
    asyncio.run(main())
