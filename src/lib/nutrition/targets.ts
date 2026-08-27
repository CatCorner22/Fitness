import { and, desc, eq, gte } from "drizzle-orm";
import { daysAgoISO } from "@/lib/utils";
import { db } from "@/lib/db";
import { bodyweightLogs, nutritionLogs } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import { goalNutrition, type GoalNutrition } from "@/lib/nutrition/goals";
import { activeDiet, dietCalorieFloor } from "@/lib/nutrition/diet-state";

type MacroSpec = Pick<GoalNutrition, "carbRatio" | "fatRatio">;

export function mifflinStJeor(profile: ProfileRow) {
  const weight = profile.weightKg;
  const height = profile.heightCm;
  const age = profile.age;
  if (!weight || !height || !age) return null;
  const s = profile.sex === "female" ? -161 : profile.sex === "male" ? 5 : -78;
  return 10 * weight + 6.25 * height - 5 * age + s;
}

export function activityFactor(daysPerWeek: number) {
  if (daysPerWeek <= 2) return 1.375;
  if (daysPerWeek <= 4) return 1.55;
  return 1.725;
}

export function nutritionSpec(profile: ProfileRow): GoalNutrition {
  const diet = activeDiet(profile);
  const base = goalNutrition(profile.goal);
  if (!diet) return base;
  const phase = diet.phase;
  const finished = diet.finished;
  return {
    goal: profile.goal,
    title: diet.program.name,
    label: finished ? `${diet.program.name} (done)` : phase.name,
    blurb: finished
      ? (diet.program.afterNote ??
        "This diet block is over. Enroll Reverse or Recomp so calories do not stay at peak-week forever.")
      : phase.note,
    delta: finished ? 0 : phase.delta,
    proteinPerKg: phase.proteinPerKg,
    carbRatio: phase.carbRatio,
    fatRatio: phase.fatRatio,
    fallbackCalories: Math.max(dietCalorieFloor(profile), base.fallbackCalories + (finished ? 0 : phase.delta)),
  };
}

export function proteinTargetG(profile: ProfileRow) {
  const kg = profile.weightKg ?? 70;
  return Math.round(nutritionSpec(profile).proteinPerKg * kg);
}

export function estimatedTdee(profile: ProfileRow) {
  const bmr = mifflinStJeor(profile);
  if (!bmr) return null;
  return Math.round(bmr * activityFactor(profile.daysPerWeek));
}

export function calorieTarget(profile: ProfileRow) {
  const spec = nutritionSpec(profile);
  const tdee = estimatedTdee(profile);
  const floor = dietCalorieFloor(profile);
  if (!tdee) return spec.fallbackCalories;
  return clampCalories(Math.round(tdee + spec.delta), floor);
}

export function macroTargets(calories: number, proteinG: number, spec: MacroSpec) {
  const safeCalories = Math.max(calories, proteinG * 4 + 200);
  const proteinCals = proteinG * 4;
  const remaining = Math.max(0, safeCalories - proteinCals);
  const ratio = spec.carbRatio + spec.fatRatio;
  const carbShare = ratio > 0 ? spec.carbRatio / ratio : 0.6;
  return {
    calories: Math.round(safeCalories),
    protein: Math.round(proteinG),
    carbs: Math.round((remaining * carbShare) / 4),
    fat: Math.round((remaining * (1 - carbShare)) / 9),
  };
}

function clampCalories(n: number, floor: number) {
  return Math.min(6000, Math.max(floor, Math.round(n)));
}

export function adaptiveCalories(userId: string, profile: ProfileRow) {
  const spec = nutritionSpec(profile);
  const diet = activeDiet(profile);
  const floor = dietCalorieFloor(profile);
  const staticTdee = estimatedTdee(profile);
  const protein = proteinTargetG(profile);
  const weights = db
    .select()
    .from(bodyweightLogs)
    .where(eq(bodyweightLogs.userId, userId))
    .orderBy(desc(bodyweightLogs.date))
    .limit(14)
    .all();

  if (!staticTdee || weights.length < 8) {
    const calories = clampCalories(calorieTarget(profile), floor);
    const macros = macroTargets(calories, protein, spec);
    return {
      ...macros,
      tdee: staticTdee,
      surplus: spec.delta,
      goalTitle: spec.title,
      goalLabel: spec.label,
      goalBlurb: spec.blurb,
      weeklyChangeKg: null,
      diet,
      note: staticTdee
        ? `${spec.title}: Mifflin-St Jeor TDEE ${staticTdee} kcal ${spec.delta >= 0 ? "+" : ""}${spec.delta} for ${spec.label.toLowerCase()}. Floor ${floor} kcal. Log ~8 morning weigh-ins and meals to switch to adaptive TDEE.`
        : `Add age, height, and weight in settings for a personal TDEE. Using a ${macros.calories} kcal ${spec.title.toLowerCase()} placeholder until then.`,
    };
  }

  const newest = weights[0].weightKg;
  const oldest = weights[weights.length - 1].weightKg;
  const days = Math.max(
    1,
    (Date.parse(weights[0].date) - Date.parse(weights[weights.length - 1].date)) / 86400000,
  );
  const weeklyChange = ((newest - oldest) / days) * 7;

  const recentLogs = db
    .select({ date: nutritionLogs.date, calories: nutritionLogs.calories })
    .from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, userId), gte(nutritionLogs.date, daysAgoISO(14))))
    .all();
  const byDate = new Map<string, number>();
  for (const row of recentLogs) {
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.calories);
  }
  const logged = [...byDate.keys()].sort().slice(-7);
  let intake = 0;
  let intakeDays = 0;
  for (const date of logged) {
    const dayCals = byDate.get(date) ?? 0;
    if (dayCals > 400) {
      intake += dayCals;
      intakeDays++;
    }
  }

  const avgIntake = intakeDays ? intake / intakeDays : staticTdee;
  const impliedTdee = avgIntake - (weeklyChange * 7700) / 7;
  const adapted = clampCalories(Math.round(impliedTdee), floor);
  const calories = clampCalories(Math.round(adapted + spec.delta), floor);
  const macros = macroTargets(calories, protein, spec);

  return {
    ...macros,
    tdee: adapted,
    surplus: spec.delta,
    goalTitle: spec.title,
    goalLabel: spec.label,
    goalBlurb: spec.blurb,
    weeklyChangeKg: weeklyChange,
    diet,
    note: `Adaptive TDEE ${adapted} kcal from ${intakeDays} logged days and ${weights.length} weigh-ins (${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(2)} kg/week), then ${spec.delta >= 0 ? "+" : ""}${spec.delta} for ${spec.title.toLowerCase()}. Floor ${floor} kcal.`,
  };
}
