export function parseRepTarget(reps: string | null | undefined) {
  if (!reps) return 8;
  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : 8;
}

export function hardnessToRpe(value: string) {
  if (value === "easy") return 6;
  if (value === "ok") return 7.5;
  if (value === "hard") return 9;
  return null;
}

export function programForGoal(goal: string) {
  if (goal === "powerlifting") return "powerlifting";
  if (goal === "bodybuilding" || goal === "glute_specialization") return "ppl";
  if (goal === "strength_endurance") return "strength_endurance";
  if (goal === "pole_stage") return "pole_stage";
  if (goal === "exotic_stage") return "pole_amateur_night";
  return "upper_lower";
}
