#!/usr/bin/env python3
"""Prove programmed sessions are untruncated and Nyx lessons cover class skills."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path("/workspace")
SRC = ROOT / "src"

errors: list[str] = []


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def collect_ids(pattern: str, *files: Path) -> list[str]:
    found: list[str] = []
    rx = re.compile(pattern, re.MULTILINE)
    for path in files:
        found.extend(rx.findall(read(path)))
    return found


exercise_files = sorted((SRC / "lib/exercises").glob("*.ts"))
program_files = sorted((SRC / "lib/programs").glob("*.ts"))
course_files = sorted((SRC / "lib/course").glob("*.ts"))

exercise_ids = set(collect_ids(r'^\s+id:\s*"([^"]+)"', *exercise_files))
# registry uses `id:` on Exercise objects; also allow movement/exotic.
if len(exercise_ids) < 50:
    errors.append(f"suspiciously few exercise ids: {len(exercise_ids)}")

programmed = collect_ids(r'exerciseId:\s*"([^"]+)"', *program_files)
missing_ex = sorted({eid for eid in programmed if eid not in exercise_ids})
if missing_ex:
    errors.append(f"programmed exercise ids missing from registry: {missing_ex}")

plan = read(SRC / "lib/programs/plan.ts")
if "dropped: []" not in plan and "dropped: [] as string[]" not in plan:
    errors.append("trimForDuration must return an empty dropped list")
if "trimmed: false" not in plan:
    errors.append("buildPlannedSession must set trimmed: false")
if "droppedExerciseIds: []" not in plan:
    errors.append("buildPlannedSession must set droppedExerciseIds: []")
if 'if (!chosen) continue' in plan:
    errors.append("plan.ts still skips a programmed slot when pickSubstitute fails")

banned_copy = [
    "Dropped first when time is short",
    "drop optional isolation",
    "Drop optional isolation",
    "skip optional work",
    "skip extras",
    "keep compounds, skip extras",
]
blob = "\n".join(read(p) for p in SRC.rglob("*.ts")) + "\n".join(read(p) for p in SRC.rglob("*.tsx"))
for phrase in banned_copy:
    if phrase in blob:
        errors.append(f"leftover truncation copy: {phrase!r}")

skill_ids = set(collect_ids(r'^\s+id:\s*"([^"]+)"', *course_files))
catalog = read(SRC / "lib/course/catalog.ts")
listed = re.findall(r'skillIds:\s*\[([^\]]+)\]', catalog)
for block in listed:
    for sid in re.findall(r'"([^"]+)"', block):
        if sid not in skill_ids:
            errors.append(f"course module lists unknown skill {sid}")

skill_by_ex = {}
for path in course_files:
    text = read(path)
    for block in re.split(r"\n  skill\(\{", text)[1:]:
        sid = re.search(r'id:\s*"([^"]+)"', block)
        ex = re.search(r'exerciseId:\s*"([^"]+)"', block)
        if sid and ex:
            skill_by_ex.setdefault(ex.group(1), []).append(sid.group(1))

class_cover = [
    "pullup",
    "inverted-row",
    "dead-hang",
    "active-hang-repeat",
    "hanging-tuck",
    "pole-walk",
    "pole-squat-hold",
    "fireman-spin",
    "chair-spin",
    "pole-sit",
    "basic-climb",
    "controlled-descent",
    "pole-tuck-prep",
    "class-capacity-circuit",
    "back-to-pole-pose",
]
for eid in class_cover:
    if eid not in skill_by_ex:
        errors.append(f"intermediate class drill {eid} has no Nyx lesson")

stills = [
    ROOT / "public/instructor/nyx-portrait.webp",
    ROOT / "public/instructor/nyx-walk.webp",
    ROOT / "public/instructor/nyx-wave.webp",
    ROOT / "public/instructor/nyx-chair.webp",
    ROOT / "public/instructor/nyx-sit.webp",
    ROOT / "public/instructor/nyx-pole.webp",
    ROOT / "public/instructor/nyx-hang.webp",
]
for still in stills:
    if not still.exists() or still.stat().st_size < 40_000:
        errors.append(f"photoreal still missing or still tiny: {still.name}")

banned_ids = set()
for path in exercise_files:
    text = read(path)
    blocks = re.split(r"\n  \{", text)
    for block in blocks:
        eid = re.search(r'id:\s*"([^"]+)"', block)
        safety = re.search(r'safety:\s*"([^"]+)"', block)
        if eid and safety and safety.group(1) == "banned":
            banned_ids.add(eid.group(1))
required_bans = {"bench-dip", "parallel-bar-dip", "behind-neck-press", "behind-neck-pulldown", "upright-row-chin", "kipping-pullup"}
missing_bans = sorted(required_bans - banned_ids)
if missing_bans:
    errors.append(f"expected banned lifts missing from registry: {missing_bans}")
programmed_banned = sorted({eid for eid in programmed if eid in banned_ids})
if programmed_banned:
    errors.append(f"banned lifts are programmed: {programmed_banned}")
risky_names = ("sit-up", "situp", "crunch", "headstand", "plow-pose", "skull-crusher", "good-morning")
risky_programmed = sorted({eid for eid in programmed if any(r in eid for r in risky_names)})
if risky_programmed:
    errors.append(f"risky movement ids programmed: {risky_programmed}")
if 'original.safety === "banned") continue' not in plan and "original.safety === 'banned') continue" not in plan:
    errors.append("planner must refuse to keep a banned lift")

if errors:
    print("FAIL")
    for err in errors:
        print("-", err)
    sys.exit(1)

print(
    f"OK {len(exercise_ids)} exercises, {len(programmed)} programmed slots, "
    f"{len(skill_ids)} skills, class drills covered, photoreal stills present"
)
