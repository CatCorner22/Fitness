import type { Course } from "./types";
import { SKILLS } from "./skills";

export const COURSES: Course[] = [
  {
    id: "exotic_amateur_night",
    programId: "pole_amateur_night",
    name: "Amateur night: commercial set",
    tagline: "Walk, floor, chair, pole-as-prop, and a song you can finish.",
    adult: true,
    description:
      "A training course for an adult amateur-night set. Nyx teaches the same skill five ways: a short cue, numbered steps, a diagram, a photo or illustrated plate, and a sultry spoken pass you can replay. Pick the channel that lands. Skip the ones that do not. This is set-craft, not a featured-dancer factory, and it will not teach inverts from a phone.",
    howToLearn: [
      "Read the short cue.",
      "Do the numbered steps, one at a time.",
      "Look at the diagram, then the photo or plate.",
      "Play Nyx’s voice. Pause whenever you want. Replay freely.",
      "Watch the short clip if you want motion.",
      "Then put it in the day’s workout. We never hide or drop a listed drill.",
    ],
    modules: [
      {
        id: "presence",
        title: "1. Presence",
        weeks: "Weeks 1–3",
        intent: "Own the walk, the eyes, and the arms before any trick.",
        skillIds: ["walk", "eyeline", "arms"],
      },
      {
        id: "body",
        title: "2. Body",
        weeks: "Weeks 1–4",
        intent: "Waves, figure-eights, and pulses that read as commercial — not a dumped back.",
        skillIds: ["wave", "hip8", "pulse", "chest"],
      },
      {
        id: "floor",
        title: "3. Floor",
        weeks: "Weeks 3–7",
        intent: "Get down, move, and get up without a thud.",
        skillIds: ["descent", "tabletop", "knee-circle", "floor-roll"],
      },
      {
        id: "chair",
        title: "4. Chair",
        weeks: "Weeks 5–8",
        intent: "Furniture, not a person. Approach, sit, roll, stand.",
        skillIds: ["chair-approach", "seated-hips", "chair-roll"],
      },
      {
        id: "pole-prop",
        title: "5. Pole as prop",
        weeks: "Weeks 4–10",
        intent: "Walks, poses, a sit, a climb — both sides. Tricks you already own.",
        skillIds: ["pole-walk", "back-to-pole", "fireman", "sit", "climb"],
      },
      {
        id: "set",
        title: "6. Set craft",
        weeks: "Weeks 9–12",
        intent: "8-counts, one layer, one song. Then stop.",
        skillIds: ["eight-count", "layers", "show-run"],
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
      "Show up to an intermediate pole-fitness class with the strength, grip, and cardio to last the hour. Off-pole engine plus on-pole skills, both sides, no kipping. A spotted invert is studio-only. This course uses the same multi-channel lessons: cue, steps, diagram, photo, voice.",
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
        intent: "Hangs you can repeat and lungs that last a class.",
        skillIds: ["hang", "capacity"],
      },
      {
        id: "spins",
        title: "2. Spins both sides",
        weeks: "Weeks 2–7",
        intent: "Fireman and hook, equal volume, static pole first.",
        skillIds: ["pole-walk", "fireman", "hook"],
      },
      {
        id: "climb-mod",
        title: "3. Sit, climb, down",
        weeks: "Weeks 4–8",
        intent: "Three controlled climbs. Sits you do not drop into. Down is a skill.",
        skillIds: ["sit", "climb", "descent-pole"],
      },
      {
        id: "invert-mod",
        title: "4. Invert-ready",
        weeks: "Weeks 6–8",
        intent: "Tuck holds. No kip. Studio spot if you invert at all.",
        skillIds: ["tuck"],
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
