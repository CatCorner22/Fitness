#!/usr/bin/env python3
"""Generate Nyx spoken audio (edge-tts) and Ken Burns clips from stills."""

from __future__ import annotations

import asyncio
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path("/workspace")
SKILLS = ROOT / "src/lib/course/skills.ts"
AUDIO = ROOT / "public/instructor/audio"
VIDEO = ROOT / "public/instructor/video"
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
    "descent": "nyx-walk.webp",
    "tabletop": "nyx-walk.webp",
    "knee-circle": "nyx-walk.webp",
    "floor-roll": "nyx-walk.webp",
    "layers": "nyx-portrait.webp",
    "eight-count": "nyx-walk.webp",
    "show-run": "nyx-walk.webp",
    "pole-walk": "nyx-walk.webp",
    "back-to-pole": "nyx-sit.webp",
    "fireman": "nyx-sit.webp",
    "hook": "nyx-sit.webp",
    "sit": "nyx-sit.webp",
    "climb": "nyx-sit.webp",
    "descent-pole": "nyx-sit.webp",
    "tuck": "nyx-sit.webp",
    "hang": "nyx-portrait.webp",
    "capacity": "nyx-walk.webp",
}


def parse_scripts() -> dict[str, str]:
    text = SKILLS.read_text()
    out: dict[str, str] = {}
    for block in re.split(r"\n  skill\(\{", text)[1:]:
        m_id = re.search(r'id: "([^"]+)"', block)
        m_voice = re.search(r'voiceScript:\s*\n\s*"([^"]+)"', block)
        if m_id and m_voice:
            out[m_id.group(1)] = m_voice.group(1)
    return out


async def tts(skill_id: str, script: str) -> None:
    import edge_tts

    dest = AUDIO / f"{skill_id}.mp3"
    comm = edge_tts.Communicate(
        script,
        voice="en-US-AriaNeural",
        rate="-12%",
        pitch="-6Hz",
    )
    await comm.save(str(dest))
    print("audio", dest.name, dest.stat().st_size)


def ken_burns(src: Path, dest: Path, seconds: float = 8) -> None:
    if dest.exists() and dest.stat().st_size > 1000:
        return
    frames = int(seconds * 25)
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
    print("video", dest.name, dest.stat().st_size)


async def main() -> None:
    scripts = parse_scripts()
    print("skills", len(scripts))
    # generate unique still videos first
    still_dir = ROOT / "public/instructor"
    unique_stills = {PHOTO[k] for k in scripts if k in PHOTO}
    cache: dict[str, Path] = {}
    for still in unique_stills:
        src = still_dir / still
        tmp = VIDEO / f"_base_{src.stem}.mp4"
        ken_burns(src, tmp)
        cache[still] = tmp
    for skill_id in scripts:
        still = PHOTO.get(skill_id, "nyx-portrait.webp")
        dest = VIDEO / f"{skill_id}.mp4"
        shutil.copyfile(cache[still], dest)

    sem = asyncio.Semaphore(3)

    async def one(sid: str, script: str) -> None:
        async with sem:
            await tts(sid, script)

    await asyncio.gather(*(one(sid, sc) for sid, sc in scripts.items()))


if __name__ == "__main__":
    asyncio.run(main())
