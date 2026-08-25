import type { Course } from "./types";
import { SKILLS } from "./skills";

export const COURSES: Course[] = [
  {
    id: "exotic_amateur_night",
    programId: "pole_amateur_night",
    name: "Amateur night: commercial exotic set",
    tagline: "Walk, body, floor, chair/lap stand-in, costume, pole-as-prop, and a two-song map you can finish.",
    adult: true,
    description:
      "A training course for an adult amateur-night / club-style set. This is actual exotic skill — walk, heels, hands, stage map, commercial hips, fan kick, pirouette, floor crawls, table/podium, chair phrases trained on furniture, costume peels including a jacket, rail and tip-tray visits, and a close — not a pole-fitness trick list. Nyx teaches each skill several ways: a short cue, one step at a time, a diagram, a photoreal photo or editorial plate, and a sultry spoken pass you can pause and replay. Pick the channel that lands. Skip the rest. Chair work is a stand-in, not a person. Inverts stay out of the show until they are boring in class.",
    howToLearn: [
      "Watch Nyx (photo, plate, or a slow still-clip with her voice — not a filmed demo).",
      "Read the short cue, then do one numbered step at a time.",
      "Play the spoken pass. Pause whenever you want. Replay freely. The words stay on screen.",
      "Your turn: the practice block. Rest. Repeat.",
      "Move on when the pass line is true — not when a clock says so.",
      "Put it in the day’s workout. We never hide or drop a listed drill.",
    ],
    modules: [
      {
        id: "presence",
        title: "1. Presence",
        weeks: "Weeks 1–3",
        intent: "Own the walk, the eyes, the hands, and the box before any trick.",
        skillIds: ["walk", "eyeline", "arms", "hands", "stage-map", "ankle-prep", "heels"],
      },
      {
        id: "body",
        title: "2. Body",
        weeks: "Weeks 1–4",
        intent: "Waves, figure-eights, pulses, shimmy, and a standing grind that read as commercial.",
        skillIds: ["wave", "hip8", "pulse", "chest", "shimmy", "grind", "fan-kick", "pirouette"],
      },
      {
        id: "floor",
        title: "3. Floor",
        weeks: "Weeks 3–7",
        intent: "Get down, crawl, sit, grind, and get up without a thud.",
        skillIds: ["descent", "tabletop", "knee-circle", "crawl", "floor-roll", "floor-grind", "mermaid", "ladder", "table-edge"],
      },
      {
        id: "chair",
        title: "4. Chair (lap stand-in)",
        weeks: "Weeks 5–8",
        intent: "Furniture, not a person. Approach, reverse sit, three-part phrase.",
        skillIds: ["chair-approach", "seated-hips", "chair-roll", "reverse-chair", "lap-phrase"],
      },
      {
        id: "costume",
        title: "5. Costume",
        weeks: "Weeks 6–10",
        intent: "Layers, skirt, peel, and a heel plan — counted, not panicked.",
        skillIds: ["layers", "skirt", "peel", "jacket-peel", "heel-floor"],
      },
      {
        id: "pole-prop",
        title: "6. Pole as prop",
        weeks: "Weeks 4–10",
        intent: "Walks, poses, a sit, a climb — both sides. Tricks you already own.",
        skillIds: ["pole-walk", "back-to-pole", "fireman", "sit", "climb"],
      },
      {
        id: "set",
        title: "7. Club set craft",
        weeks: "Weeks 9–12",
        intent: "8-counts, rail, two-song map, close, recovery. Then stop.",
        skillIds: ["eight-count", "rail", "tip-tray", "two-song", "show-run", "close", "recovery"],
      },
    ],
  },
  {
    id: "pole_class_intermediate",
    programId: "pole_stage",
    name: "Intermediate pole class prep",
    tagline: "Grip, both-side spins, sit, climb, invert prep, and class-length lungs.",
    adult: false,
    description:
      "Show up to an intermediate pole-fitness class with the strength, grip, and cardio to last the hour. Off-pole engine (repeat hangs, strict pull-ups, inverted rows) plus on-pole skills both sides: walk, squat hold, fireman, front hook, back hook, carousel, sit, climb, climb-to-sit, outside-leg hang, controlled down, hanging tuck then on-pole tuck. No kipping. A spotted invert is studio-only. Same multi-channel lessons: cue, steps, diagram, photoreal photo, editorial plate, voice, slow still-clip.",
    howToLearn: [
      "Start with hangs and pulls. Grip fails first in class.",
      "Train every spin both directions. No bonus sets for the pretty side.",
      "Climbs before inverts. Tucks before handsprings.",
      "Use the capacity circuit so a 45–60 minute class does not cook you at minute twenty.",
      "Crash mat. Studio for anything off the floor that still scares you.",
    ],
    modules: [
      {
        id: "engine",
        title: "1. Class engine",
        weeks: "Weeks 1–8",
        intent: "Hangs you can repeat, pulls class actually uses, and lungs that last the hour.",
        skillIds: ["hang", "repeat-hang", "pullup", "inverted-row", "capacity"],
      },
      {
        id: "spins",
        title: "2. Spins both sides",
        weeks: "Weeks 2–7",
        intent: "Walk, squat hold, fireman, hook — equal volume, static pole first.",
        skillIds: ["pole-walk", "pole-squat", "fireman", "hook", "back-hook", "carousel"],
      },
      {
        id: "climb-mod",
        title: "3. Sit, climb, down",
        weeks: "Weeks 4–8",
        intent: "Three controlled climbs. Sits you do not drop into. Down is a skill.",
        skillIds: ["sit", "climb", "climb-to-sit", "olh", "descent-pole"],
      },
      {
        id: "invert-mod",
        title: "4. Invert-ready",
        weeks: "Weeks 6–8",
        intent: "Bar tuck, then on-pole tuck. No kip. Studio spot if you invert at all.",
        skillIds: ["hanging-tuck", "tuck"],
      },
    ],
  },
];

export function courseById(id: string) {
  return COURSES.find((c) => c.id === id);
}

export function courseForProgram(programId: string) {
  return COURSES.find((c) => c.programId === programId);
}

export function skillsInCourse(courseId: string) {
  const course = courseById(courseId);
  if (!course) return [];
  const ids = course.modules.flatMap((m) => m.skillIds);
  return ids.map((id) => SKILLS.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
}
