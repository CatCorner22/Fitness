const GOAL_PROGRAMS: Record<string, string> = {
  powerlifting: "powerlifting",
  bodybuilding: "ppl",
  glute_specialization: "ppl",
  strength_endurance: "strength_endurance",
  pole_stage: "pole_stage",
  exotic_stage: "pole_amateur_night",
};

const HARDNESS_RPE = { easy: 6, ok: 7.5, hard: 9 } as const;

export function parseRepTarget(reps: string | null | undefined) {
  if (!reps) return 8;
  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : 8;
}

export function hardnessToRpe(value: string) {
  return HARDNESS_RPE[value as keyof typeof HARDNESS_RPE] ?? null;
}

export function programForGoal(goal: string) {
  return GOAL_PROGRAMS[goal] ?? "upper_lower";
}
