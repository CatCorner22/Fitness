import type { Goal } from "@/lib/types";

export type GoalNutrition = {
  goal: Goal;
  title: string;
  label: string;
  blurb: string;
  /** kcal added to TDEE. Negative is a cut. */
  delta: number;
  proteinPerKg: number;
  /** Share of leftover calories after protein. */
  carbRatio: number;
  fatRatio: number;
  fallbackCalories: number;
};

export const GOAL_NUTRITION: Record<Goal, GoalNutrition> = {
  powerlifting: {
    goal: "powerlifting",
    title: "Strength surplus",
    label: "Powerlifting",
    blurb: "Slight surplus so heavy sessions recover. Protein high enough to hold muscle; carbs sit around the barbell work.",
    delta: 150,
    proteinPerKg: 2.0,
    carbRatio: 0.48,
    fatRatio: 0.27,
    fallbackCalories: 2600,
  },
  bodybuilding: {
    goal: "bodybuilding",
    title: "Hypertrophy surplus",
    label: "Bodybuilding",
    blurb: "About +250 kcal over expenditure. Protein first, then carbs to fill the tank for volume.",
    delta: 250,
    proteinPerKg: 2.0,
    carbRatio: 0.5,
    fatRatio: 0.25,
    fallbackCalories: 2800,
  },
  glute_specialization: {
    goal: "glute_specialization",
    title: "Glute-building surplus",
    label: "Glute specialization",
    blurb: "Small surplus and high protein. You grow glutes with progressive tension and enough food, not with mystery booty supplements.",
    delta: 200,
    proteinPerKg: 2.2,
    carbRatio: 0.42,
    fatRatio: 0.28,
    fallbackCalories: 2400,
  },
  strength_endurance: {
    goal: "strength_endurance",
    title: "Fuel the volume",
    label: "Strength + endurance",
    blurb: "Near-maintenance with extra carbs so the second session of the week does not turn into junk mileage.",
    delta: 100,
    proteinPerKg: 1.8,
    carbRatio: 0.55,
    fatRatio: 0.22,
    fallbackCalories: 2500,
  },
  pole_stage: {
    goal: "pole_stage",
    title: "Stage maintain",
    label: "Pole class",
    blurb: "Hold weight, keep protein high for pulling and grip, and put carbs near training so class and climbs do not run on fumes.",
    delta: 0,
    proteinPerKg: 1.8,
    carbRatio: 0.45,
    fatRatio: 0.28,
    fallbackCalories: 2200,
  },
  exotic_stage: {
    goal: "exotic_stage",
    title: "Set-craft fuel",
    label: "Amateur night / exotic",
    blurb: "Hold weight. Protein for pulling and floor work. Carbs near rehearsals. This app will not praise a crash diet before amateur night.",
    delta: 0,
    proteinPerKg: 1.8,
    carbRatio: 0.45,
    fatRatio: 0.28,
    fallbackCalories: 2200,
  },
  general: {
    goal: "general",
    title: "Maintain",
    label: "General",
    blurb: "Match expenditure. Protein at 1.8 g/kg. Adjust in settings if you want a dedicated cut or surplus later.",
    delta: 0,
    proteinPerKg: 1.8,
    carbRatio: 0.42,
    fatRatio: 0.3,
    fallbackCalories: 2200,
  },
};

export function goalNutrition(goal: Goal | string | null | undefined): GoalNutrition {
  if (goal && goal in GOAL_NUTRITION) return GOAL_NUTRITION[goal as Goal];
  return GOAL_NUTRITION.general;
}
