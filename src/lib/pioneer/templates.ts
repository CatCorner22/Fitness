import type { PioneerHousehold, PioneerKind } from "./types";

export type PioneerTemplate = {
  id: string;
  label: string;
  kind: PioneerKind;
  build: (h: PioneerHousehold) => string;
};

function injuryLine(h: PioneerHousehold) {
  return h.injuries.length ? h.injuries.join(", ") : "none flagged";
}

export const PIONEER_TEMPLATES: PioneerTemplate[] = [
  {
    id: "week-sketch",
    label: "Week sketch",
    kind: "training",
    build: (h) =>
      `Week sketch — ${h.programName ?? "current plan"}, ${h.daysPerWeek} days, ${h.sessionMinutes} min cap.

Goal: ${h.goal}. Experience: ${h.experience}. Joints: ${injuryLine(h)}.
${h.deload ? "Household read: easy week. Keep the list, drop the ego.\n" : ""}
Day 1:
Day 2:
Day 3:

Main work: sets × reps @ RPE.
No bench/chair/bar dips. No behind-the-neck. No chin-height upright rows. No kipping.
Sharp, hot, or numb pain is a stop.`,
  },
  {
    id: "eat-day",
    label: "Eat day",
    kind: "nutrition",
    build: (h) =>
      `Eat day — target ${h.calorieTarget} kcal, ${h.proteinTarget} g protein (floor ${h.calorieFloor}).
${h.dietName ? `Diet block: ${h.dietName}${h.dietPhase ? ` · ${h.dietPhase}` : ""}.` : "Training-goal calories."}
${h.lowHistamine ? "Fresh-cook or freeze the same day. No leftover fish, aged cheese, or fermented dairy as defaults.\n" : ""}
Breakfast:
Lunch:
Dinner:
Snack:

Protein first. No juice cleanse. No water cut.`,
  },
  {
    id: "cut-week",
    label: "Cut week",
    kind: "mixed",
    build: (h) =>
      `Cut week check.

Fuel: about ${h.calorieTarget} kcal, ${h.proteinTarget} g protein. Floor ${h.calorieFloor} kcal.
Training: ${h.daysPerWeek} days, keep every listed drill. Compounds at honest RPE. No extra HIIT to earn food.
Sleep: hours I actually get.
Energy today: ${h.fatigue ?? "not logged"} / 5.

If the scale stalls, I will look at logging before I shrink dinner again.`,
  },
  {
    id: "deload-note",
    label: "Deload note",
    kind: "mixed",
    build: (h) =>
      `Deload note.

Keep the listed drills. Cut load and RPE, not the list.
Session cap still ${h.sessionMinutes} min.
Protein stays near ${h.proteinTarget} g. Calories near ${h.calorieTarget}.
Sleep target: 8 hours. If a joint is sharp, hot, or numb — stop.`,
  },
];
