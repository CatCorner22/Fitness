import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyweightLogs, nutritionLogs } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import { goalNutrition } from "@/lib/nutrition/goals";

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

export function proteinTargetG(profile: ProfileRow) {
  const kg = profile.weightKg ?? 70;
  return Math.round(goalNutrition(profile.goal).proteinPerKg * kg);
}

export function estimatedTdee(profile: ProfileRow) {
  const bmr = mifflinStJeor(profile);
  if (!bmr) return null;
  return Math.round(bmr * activityFactor(profile.daysPerWeek));
}

export function calorieTarget(profile: ProfileRow) {
  const spec = goalNutrition(profile.goal);
  const tdee = estimatedTdee(profile);
  if (!tdee) return spec.fallbackCalories;
  return Math.round(tdee + spec.delta);
}

export function macroTargets(calories: number, proteinG: number, goal: ProfileRow["goal"]) {
  const spec = goalNutrition(goal);
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

function clampCalories(n: number) {
  return Math.min(6000, Math.max(1200, Math.round(n)));
}

export function adaptiveCalories(userId: string, profile: ProfileRow) {
  const spec = goalNutrition(profile.goal);
  const staticTdee = estimatedTdee(profile);
  const protein = proteinTargetG(profile);
  const weights = db
    .select()
    .from(bodyweightLogs)
    .where(eq(bodyweightLogs.userId, userId))
    .orderBy(desc(bodyweightLogs.date))
    .all()
    .slice(0, 14);

  if (!staticTdee || weights.length < 8) {
    const calories = clampCalories(calorieTarget(profile));
    const macros = macroTargets(calories, protein, profile.goal);
    return {
      ...macros,
      tdee: staticTdee,
      surplus: spec.delta,
      goalTitle: spec.title,
      goalLabel: spec.label,
      goalBlurb: spec.blurb,
      weeklyChangeKg: null,
      note: staticTdee
        ? `${spec.title}: Mifflin-St Jeor TDEE ${staticTdee} kcal ${spec.delta >= 0 ? "+" : ""}${spec.delta} for ${spec.label.toLowerCase()}. Log ~8 morning weigh-ins and meals to switch to adaptive TDEE.`
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

  const recentDays = new Set(
    db
      .select()
      .from(nutritionLogs)
      .where(eq(nutritionLogs.userId, userId))
      .all()
      .map((l) => l.date),
  );
  const logged = [...recentDays].sort().slice(-7);
  let intake = 0;
  let intakeDays = 0;
  for (const date of logged) {
    const dayLogs = db
      .select()
      .from(nutritionLogs)
      .where(and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, date)))
      .all();
    const dayCals = dayLogs.reduce((s, l) => s + l.calories, 0);
    if (dayCals > 400) {
      intake += dayCals;
      intakeDays++;
    }
  }

  const avgIntake = intakeDays ? intake / intakeDays : staticTdee;
  const impliedTdee = avgIntake - (weeklyChange * 7700) / 7;
  const adapted = clampCalories(Math.round(impliedTdee));
  const calories = clampCalories(Math.round(adapted + spec.delta));
  const macros = macroTargets(calories, protein, profile.goal);

  return {
    ...macros,
    tdee: adapted,
    surplus: spec.delta,
    goalTitle: spec.title,
    goalLabel: spec.label,
    goalBlurb: spec.blurb,
    weeklyChangeKg: weeklyChange,
    note: `Adaptive TDEE ${adapted} kcal from ${intakeDays} logged days and ${weights.length} weigh-ins (${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(2)} kg/week), then ${spec.delta >= 0 ? "+" : ""}${spec.delta} for ${spec.title.toLowerCase()}.`,
  };
}
