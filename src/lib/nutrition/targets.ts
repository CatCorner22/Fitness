import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyweightLogs, nutritionLogs } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";

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
  return Math.round(1.8 * kg);
}

export function calorieTarget(profile: ProfileRow) {
  const bmr = mifflinStJeor(profile);
  if (!bmr) return null;
  const tdee = Math.round(bmr * activityFactor(profile.daysPerWeek));
  if (profile.goal === "bodybuilding" || profile.goal === "glute_specialization") {
    return tdee + 200;
  }
  return tdee;
}

export function adaptiveCalories(userId: string, profile: ProfileRow) {
  const base = calorieTarget(profile);
  const weights = db
    .select()
    .from(bodyweightLogs)
    .where(eq(bodyweightLogs.userId, userId))
    .orderBy(desc(bodyweightLogs.date))
    .all()
    .slice(0, 14);

  if (!base || weights.length < 8) {
    return {
      calories: base,
      protein: proteinTargetG(profile),
      tdee: base,
      note: base
        ? "Static estimate from Mifflin-St Jeor × activity. Log ~8 morning weigh-ins and your meals so we can adapt like MacroFactor, with the math shown."
        : "Add age, height, and weight in settings for a calorie target.",
      weeklyChangeKg: null,
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

  const avgIntake = intakeDays ? intake / intakeDays : base;
  // ~7700 kcal per kg. If weight is rising faster than intended (~0.25 kg/wk surplus), trim.
  const impliedTdee = avgIntake - (weeklyChange * 7700) / 7;
  const adapted = Math.round(impliedTdee);

  return {
    calories: adapted,
    protein: proteinTargetG(profile),
    tdee: adapted,
    weeklyChangeKg: weeklyChange,
    note: `Adaptive TDEE from ${intakeDays} logged days and ${weights.length} weigh-ins. Trend: ${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(2)} kg/week. Implied expenditure ≈ ${adapted} kcal. This is inspectable math, not a black box.`,
  };
}