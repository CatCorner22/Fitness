import { and, desc, eq, gte } from "drizzle-orm";
import { daysAgoISO, todayISO } from "@/lib/utils";
import { db } from "@/lib/db";
import { bodyweightLogs, nutritionLogs } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import { goalNutrition, type GoalNutrition } from "@/lib/nutrition/goals";
import { activeDiet, dietCalorieFloor } from "@/lib/nutrition/diet-state";
import { bodyCompOption, bodyCompTargets, type BodyCompTargets } from "@/lib/nutrition/body-comp";

type MacroSpec = Pick<GoalNutrition, "carbRatio" | "fatRatio">;

/** Mifflin-St Jeor 1990 resting energy expenditure. Unspecified sex uses the midpoint constant. */
export function mifflinStJeor(profile: Pick<ProfileRow, "weightKg" | "heightCm" | "age" | "sex">) {
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

type BodyCompProfile = Pick<
  ProfileRow,
  "bodyCompGoal" | "sex" | "weightKg" | "heightCm" | "age" | "bodyFatPct" | "experience" | "mealsPerDay" | "activeDietId"
>;

/** Body-composition targets for a profile, or null when the question has not been answered. */
export function bodyCompForProfile(profile: BodyCompProfile, tdee: number | null): BodyCompTargets | null {
  if (!profile.bodyCompGoal) return null;
  return bodyCompTargets({
    goal: profile.bodyCompGoal,
    sex: profile.sex,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: profile.age,
    bodyFatPct: profile.bodyFatPct,
    experience: profile.experience,
    mealsPerDay: profile.mealsPerDay,
    tdee,
    calorieFloor: dietCalorieFloor(profile),
  });
}

function bodyCompSpec(profile: ProfileRow, tdee: number | null): GoalNutrition | null {
  const bc = bodyCompForProfile(profile, tdee);
  if (!bc) return null;
  const option = bodyCompOption(bc.goal);
  return {
    goal: profile.goal,
    title: option.label,
    label: option.short,
    blurb: option.blurb,
    delta: bc.delta,
    proteinPerKg: bc.proteinPerKg,
    carbRatio: bc.carbRatio,
    fatRatio: bc.fatRatio,
    fallbackCalories: bc.calories,
  };
}

/**
 * Which rule set drives calories right now. A time-capped diet block always
 * wins; otherwise the body-composition answer; otherwise the training goal.
 */
export function nutritionSpec(profile: ProfileRow, tdee: number | null = estimatedTdee(profile)): GoalNutrition {
  const diet = activeDiet(profile);
  const base = bodyCompSpec(profile, tdee) ?? goalNutrition(profile.goal);
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

export function proteinTargetG(profile: ProfileRow, tdee: number | null = estimatedTdee(profile)) {
  const kg = profile.weightKg ?? 70;
  return Math.round(nutritionSpec(profile, tdee).proteinPerKg * kg);
}

export function estimatedTdee(profile: Pick<ProfileRow, "weightKg" | "heightCm" | "age" | "sex" | "daysPerWeek">) {
  const bmr = mifflinStJeor(profile);
  if (!bmr) return null;
  return Math.round(bmr * activityFactor(profile.daysPerWeek));
}

export function calorieTarget(profile: ProfileRow) {
  const tdee = estimatedTdee(profile);
  const spec = nutritionSpec(profile, tdee);
  const floor = dietCalorieFloor(profile);
  if (!tdee) return clampCalories(spec.fallbackCalories, floor);
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

export type AdaptiveTargets = ReturnType<typeof macroTargets> & {
  tdee: number | null;
  surplus: number;
  goalTitle: string;
  goalLabel: string;
  goalBlurb: string;
  weeklyChangeKg: number | null;
  /** Weigh-ins and the day span behind weeklyChangeKg, for the progress check. */
  weighIns: number;
  weighInSpanDays: number;
  diet: ReturnType<typeof activeDiet>;
  bodyComp: BodyCompTargets | null;
  note: string;
};

export function adaptiveCalories(userId: string, profile: ProfileRow): AdaptiveTargets {
  const diet = activeDiet(profile);
  const floor = dietCalorieFloor(profile);
  const staticTdee = estimatedTdee(profile);
  const weights = db
    .select()
    .from(bodyweightLogs)
    .where(eq(bodyweightLogs.userId, userId))
    .orderBy(desc(bodyweightLogs.date))
    .limit(14)
    .all();
  const spanDays =
    weights.length >= 2
      ? Math.max(0, Math.round((Date.parse(weights[0].date) - Date.parse(weights[weights.length - 1].date)) / 86400000))
      : 0;

  // Fewer than 8 weigh-ins, or all of them inside a week, is not a trend yet.
  if (!staticTdee || weights.length < 8 || spanDays < 7) {
    const spec = nutritionSpec(profile, staticTdee);
    const protein = proteinTargetG(profile, staticTdee);
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
      weighIns: weights.length,
      weighInSpanDays: spanDays,
      diet,
      bodyComp: bodyCompForProfile(profile, staticTdee),
      note: staticTdee
        ? `${spec.title}: Mifflin-St Jeor TDEE ${staticTdee} kcal ${spec.delta >= 0 ? "+" : ""}${spec.delta} for ${spec.label.toLowerCase()}. Floor ${floor} kcal. Log ~8 morning weigh-ins and meals to switch to adaptive TDEE.`
        : `Add age, height, and weight in settings for a personal TDEE. Using a ${macros.calories} kcal ${spec.title.toLowerCase()} placeholder until then.`,
    };
  }

  const newest = weights[0].weightKg;
  const oldest = weights[weights.length - 1].weightKg;
  const days = Math.max(1, spanDays);
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
  // Skip today: a half-logged day (breakfast only) would drag the average down.
  const logged = [...byDate.keys()]
    .filter((date) => date < todayISO())
    .sort()
    .slice(-7);
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
  // A weekly swing beyond ±2 kg is water, a broken scale, or a typo — not a
  // TDEE signal. Clamp before it drags the estimate hundreds of kcal off.
  const trend = Math.max(-2, Math.min(2, weeklyChange));
  const impliedTdee = avgIntake - (trend * 7700) / 7;
  // Report the estimate honestly (loose sanity bounds only); the intake floor
  // applies to the eating target, not to the TDEE estimate itself.
  const adapted = Math.min(6000, Math.max(800, Math.round(impliedTdee)));
  const spec = nutritionSpec(profile, adapted);
  const protein = proteinTargetG(profile, adapted);
  const calories = clampCalories(adapted + spec.delta, floor);
  const macros = macroTargets(calories, protein, spec);

  return {
    ...macros,
    tdee: adapted,
    surplus: spec.delta,
    goalTitle: spec.title,
    goalLabel: spec.label,
    goalBlurb: spec.blurb,
    weeklyChangeKg: weeklyChange,
    weighIns: weights.length,
    weighInSpanDays: spanDays,
    diet,
    bodyComp: bodyCompForProfile(profile, adapted),
    note: `Adaptive TDEE ${adapted} kcal from ${intakeDays} logged days and ${weights.length} weigh-ins (${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(2)} kg/week), then ${spec.delta >= 0 ? "+" : ""}${spec.delta} for ${spec.title.toLowerCase()}. Floor ${floor} kcal.`,
  };
}
