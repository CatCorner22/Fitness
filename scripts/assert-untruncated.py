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
    "outside-leg-hang",
    "carousel-spin",
    "climb-to-sit",
    "back-hook-spin",
]
for eid in class_cover:
    if eid not in skill_by_ex:
        errors.append(f"intermediate class drill {eid} has no Nyx lesson")
    if eid in ("outside-leg-hang", "carousel-spin", "climb-to-sit", "back-hook-spin") and eid not in programmed:
        errors.append(f"intermediate class drill {eid} is not programmed")

nyx_cover = [
    "ankle-prep",
    "table-edge",
    "fan-kick",
    "jacket-peel",
    "pirouette",
    "tip-tray",
]
for eid in nyx_cover:
    if eid not in skill_by_ex:
        errors.append(f"Nyx course drill {eid} has no lesson")
    if eid not in programmed:
        errors.append(f"Nyx course drill {eid} is not programmed")

stills = sorted(p for p in (ROOT / "public/instructor").glob("nyx-*.webp") if p.is_file())
if len(stills) < 30:
    errors.append(f"expected clothed + nude stills, only {len(stills)}")
for still in stills:
    if still.stat().st_size < 40_000:
        errors.append(f"photoreal still missing or still tiny: {still.name}")
    plate = ROOT / "public/instructor/plates" / still.name.replace("nyx-", "nyx-plate-")
    if not plate.exists() or plate.stat().st_size < 40_000:
        errors.append(f"editorial plate missing or still tiny: {plate.name}")

still_map = read(SRC / "lib/course/skill-stills.ts")
catalog = read(SRC / "lib/course/catalog.ts")
catalog_ids: set[str] = set()
for block in re.findall(r"skillIds:\s*\[([^\]]+)\]", catalog):
    catalog_ids.update(re.findall(r'"([^"]+)"', block))
mapped_ids = {
    key
    for key, _still in re.findall(
        r'(?:^|\n)\s+"?([A-Za-z][\w-]*)"?:\s+"([a-z]+)"',
        still_map,
    )
}
missing_map = sorted(catalog_ids - mapped_ids)
if missing_map:
    errors.append(f"catalog skills missing SKILL_STILL: {missing_map}")
skill_file_ids = set(collect_ids(r'^\s+id:\s*"([^"]+)"', *(SRC / "lib/course").glob("*-skills.ts"), SRC / "lib/course/skills.ts"))
orphan_map = sorted(mapped_ids - skill_file_ids)
if orphan_map:
    errors.append(f"SKILL_STILL keys that are not skills: {orphan_map}")

for path in (*(SRC / "lib/course").glob("*-skills.ts"), SRC / "lib/course/skills.ts"):
    blob = read(path)
    if "NYX.photos" in blob or "NYX.plates" in blob:
        errors.append(f"{path.name} still hardcodes stills instead of SKILL_STILL")

instructor_src = read(SRC / "lib/course/instructor.ts")
keys_block = re.search(r"const STILL_KEYS = \[([^\]]+)\]", instructor_src)
gallery_block = re.search(r"NYX_GALLERY: NyxStill\[\] = \[([^\]]+)\]", instructor_src)
if keys_block and gallery_block:
    photo_keys = set(re.findall(r'"([a-z]+)"', keys_block.group(1)))
    shown = set(re.findall(r'"([^"]+)"', gallery_block.group(1)))
    missing_gallery = sorted(photo_keys - shown - {"portrait"})
    if missing_gallery:
        errors.append(f"NYX_GALLERY omits stills: {missing_gallery}")
    file_keys = {p.stem.removeprefix("nyx-") for p in stills}
    missing_files = sorted(photo_keys - file_keys)
    extra_files = sorted(file_keys - photo_keys)
    if missing_files:
        errors.append(f"STILL_KEYS missing files: {missing_files}")
    if extra_files:
        errors.append(f"instructor still files not in STILL_KEYS: {extra_files}")
    unknown_stills = sorted(
        still for still in re.findall(r':\s+"([a-z]+)"', still_map) if still not in photo_keys
    )
    if unknown_stills:
        errors.append(f"SKILL_STILL points at unknown Nyx stills: {unknown_stills}")
look_ids = re.findall(r'id:\s*"(stand|chair|floor|pole|top|heels)"', instructor_src)
if len(set(look_ids)) < 5:
    errors.append(f"need several nude looks, found {look_ids}")
set_keys = re.findall(r'key:\s*"(n[a-z]+)"', instructor_src)
if len(set_keys) < 15:
    errors.append(f"need several sets per look, found {len(set_keys)} nude set keys")
if "adult nude and topless" not in instructor_src:
    errors.append("Nyx look copy should mention adult nude and topless sets")

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
if "existing.sets +=" in plan:
    errors.append("planner must not merge colliding substitutes into one lift")

diet_src = read(SRC / "lib/nutrition/diets.ts")
meal_src = read(SRC / "lib/nutrition/meal-plans.ts")
foods_src = read(SRC / "lib/nutrition/starter-foods.ts") + read(SRC / "lib/nutrition/foods.ts")
diet_ids = set(re.findall(r'id:\s*"(steady_cut|mini_cut|lean_bulk|recomp|reverse|beach_week|stage_lean|low_histamine|low_histamine_cut)"', diet_src))
if "low_histamine" not in diet_ids or "low_histamine_cut" not in diet_ids:
    errors.append("low histamine diet blocks missing from DIET_PROGRAMS")
plan_ids = set(re.findall(r'id:\s*"(low-histamine-[a-z-]+|[a-z-]+)"', meal_src))
for diet_id, plans_blob in re.findall(r'id:\s*"([^"]+)"[\s\S]*?mealPlanIds:\s*\[([^\]]+)\]', diet_src):
    for pid in re.findall(r'"([^"]+)"', plans_blob):
        if f'id: "{pid}"' not in meal_src:
            errors.append(f"diet {diet_id} references missing meal plan {pid}")
lh_foods = set(re.findall(r'id:\s*"(food-[^"]+)"', foods_src))
for pid in ("low-histamine-plate", "low-histamine-oats", "low-histamine-lighter"):
    if f'id: "{pid}"' not in meal_src:
        errors.append(f"missing low-histamine meal plan {pid}")
for fid in re.findall(r'line\("(food-[^"]+)"', meal_src):
    if fid not in lh_foods:
        errors.append(f"meal plan references unknown starter food {fid}")
high_on_lh = {"food-spinach", "food-salmon", "food-greek-yogurt", "food-cottage", "food-cheese", "food-avocado", "food-almonds", "food-beans", "food-peanut-butter", "food-bread"}
lh_block = "\n".join(
    part
    for part in re.split(r'\n  \{', meal_src)
    if 'id: "low-histamine-' in part
)
for fid in high_on_lh:
    if f'"{fid}"' in lh_block:
        errors.append(f"low-histamine menu still includes high-histamine food {fid}")
if '"turkey"' not in foods_src and 'id: "food-turkey"' not in foods_src:
    errors.append("low-histamine turkey food missing")

ff_src = read(SRC / "lib/nutrition/fast-food.ts")
if 'id: "cfa"' not in ff_src or "Grilled Nuggets (12)" not in ff_src:
    errors.append("Chick-fil-A grilled nuggets recommendation missing")
for chain in ("chipotle", "mcdonalds", "wendys", "tacobell", "subway", "panda", "innout"):
    if f'id: "{chain}"' not in ff_src:
        errors.append(f"fast-food restaurant missing: {chain}")
if "200," not in ff_src or "38," not in ff_src:
    errors.append("CFA 12-count grilled nuggets should stay ~200 kcal / 38 g protein")

calendar_core = read(SRC / "lib/calendar-core.ts")
if 'CALENDAR_EPOCH = "2026-08-23"' not in calendar_core:
    errors.append("calendar epoch must stay 2026-08-23")
if 'if (compareISO(date, today) > 0) return "gray"' not in calendar_core:
    errors.append("future calendar days must stay gray")
if 'if (compareISO(date, CALENDAR_EPOCH) < 0) return "gray"' not in calendar_core:
    errors.append("days before the epoch must stay gray")

if errors:
    print("FAIL")
    for err in errors:
        print("-", err)
    sys.exit(1)

print(
    f"OK {len(exercise_ids)} exercises, {len(programmed)} programmed slots, "
    f"{len(skill_ids)} skills, class drills covered, photoreal stills present"
)
