import type { ProfileRow } from "@/lib/auth";
import { coachContext } from "@/lib/coach/engine";
import { dietCalorieFloor } from "@/lib/nutrition/diet-state";
import { isLowHistamineDiet } from "@/lib/nutrition/diets";
import { adaptiveCalories } from "@/lib/nutrition/targets";
import { getProgram } from "@/lib/programs/catalog";
import { todayNutrition } from "@/lib/today";
import type { PioneerHousehold, PioneerKind } from "./types";

const PEAK_DIETS = new Set(["stage_lean", "beach_week"]);

export function buildPioneerHousehold(userId: string, profile: ProfileRow): PioneerHousehold {
  const food = adaptiveCalories(userId, profile);
  const plate = todayNutrition(userId);
  const ctx = coachContext(userId, profile);
  const program = getProgram(profile.activeProgramId ?? "");
  return {
    goal: profile.goal,
    experience: profile.experience,
    daysPerWeek: profile.daysPerWeek,
    sessionMinutes: profile.sessionMinutes,
    injuries: [...profile.injuries],
    dietId: profile.activeDietId,
    dietPhase: food.diet && !food.diet.finished ? food.diet.phase.name : null,
    dietName: food.diet ? food.diet.program.name : null,
    calorieTarget: food.calories,
    proteinTarget: food.protein,
    calorieFloor: dietCalorieFloor(profile),
    sex: profile.sex,
    weightKg: profile.weightKg,
    fatigue: ctx.checkin?.fatigue ?? null,
    sleepHours: ctx.checkin?.sleepHours ?? null,
    todayCalories: plate.calories,
    todayProtein: plate.protein,
    programId: profile.activeProgramId,
    programName: program?.name ?? null,
    lowHistamine: isLowHistamineDiet(profile.activeDietId),
    peakDiet: PEAK_DIETS.has(profile.activeDietId ?? "") || Boolean(food.diet?.program.extremeLean),
    deload: ctx.deload.deload,
  };
}

/** Trusted block sent to the model — no names, emails, or addresses. */
export function formatHouseholdBlock(h: PioneerHousehold) {
  return [
    `Goal: ${h.goal}. Experience: ${h.experience}.`,
    `Program: ${h.programName ?? "none"}. Days/week: ${h.daysPerWeek}. Session cap: ${h.sessionMinutes} min.`,
    `Joints: ${h.injuries.join(", ") || "none"}. Deload flag: ${h.deload ? "yes" : "no"}.`,
    `Energy check: ${h.fatigue ?? "not logged"}/5. Sleep hours: ${h.sleepHours ?? "not logged"}.`,
    `Calories target: ${h.calorieTarget}. Protein target: ${h.proteinTarget} g. Household floor: ${h.calorieFloor} kcal.`,
    `Diet: ${h.dietName ?? "training-goal calories"}${h.dietPhase ? ` · ${h.dietPhase}` : ""}. Peak-style: ${h.peakDiet ? "yes" : "no"}. Low-histamine plate: ${h.lowHistamine ? "yes" : "no"}.`,
    `Today's logged plate so far: ${Math.round(h.todayCalories)} kcal · ${Math.round(h.todayProtein)} g protein.`,
  ].join("\n");
}

export function serializePlateDraft(
  logs: { meal: string; foodName: string; calories: number; protein: number }[],
  household: PioneerHousehold,
): string {
  const meals = ["breakfast", "lunch", "dinner", "snack"] as const;
  const lines = [
    "Today's plate (logged, not a wish list)",
    `Household aim: energy ${household.calorieTarget} · protein grams ${household.proteinTarget} · floor ${household.calorieFloor}.`,
    household.dietName
      ? `Diet: ${household.dietName}${household.dietPhase ? ` · ${household.dietPhase}` : ""}.`
      : "Diet: training-goal calories.",
    "",
  ];
  for (const meal of meals) {
    const items = logs.filter((l) => l.meal === meal);
    if (!items.length) {
      lines.push(`${meal}: nothing yet`);
      continue;
    }
    lines.push(
      `${meal}: ${items.map((i) => `${i.foodName} (${Math.round(i.calories)} kcal, ${Math.round(i.protein)} g)`).join("; ")}`,
    );
  }
  lines.push(
    "",
    `Logged so far: energy ${Math.round(household.todayCalories)} · protein grams ${Math.round(household.todayProtein)}.`,
  );
  return lines.join("\n");
}

export function defaultDraftKind(household: PioneerHousehold): PioneerKind {
  if (household.todayCalories > 0 && !household.programId) return "nutrition";
  if (household.programId && household.todayCalories === 0) return "training";
  return "mixed";
}
