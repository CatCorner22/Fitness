import { STARTER_FOODS } from "@/lib/nutrition/foods";
import { goalNutrition } from "@/lib/nutrition/goals";
import { getDiet } from "@/lib/nutrition/diets";
import type { Goal } from "@/lib/types";

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

type FoodRef = (typeof STARTER_FOODS)[number];

export type PlanLine = {
  foodId: string;
  servings: number;
  meal: MealSlot;
};

export type ScaledPlanItem = PlanLine & {
  foodName: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealPlanTemplate = {
  id: string;
  name: string;
  description: string;
  goals: Goal[];
  items: PlanLine[];
};

const byId = new Map(STARTER_FOODS.map((f) => [f.id, f]));

export function foodById(id: string): FoodRef | undefined {
  return byId.get(id);
}

function line(foodId: string, servings: number, meal: MealSlot): PlanLine {
  return { foodId, servings, meal };
}

export const MEAL_PLAN_TEMPLATES: MealPlanTemplate[] = [
  {
    id: "strength-plate",
    name: "Strength plate",
    description: "Eggs and oats in the morning, meat-and-rice lunches, a heavier dinner. Built for barbell days.",
    goals: ["powerlifting", "general"],
    items: [
      line("food-oats", 1, "breakfast"),
      line("food-eggs", 1, "breakfast"),
      line("food-banana", 1, "breakfast"),
      line("food-milk", 1, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-rice", 2, "lunch"),
      line("food-broccoli", 1.5, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-beef", 1.5, "dinner"),
      line("food-potato", 2, "dinner"),
      line("food-spinach", 1, "dinner"),
      line("food-cheese", 1, "dinner"),
      line("food-greek-yogurt", 2, "snack"),
      line("food-almonds", 0.5, "snack"),
    ],
  },
  {
    id: "hypertrophy-high-carb",
    name: "Growth day",
    description: "Higher carbs around training. Whey and chicken cover protein so the rice can do its job.",
    goals: ["bodybuilding", "strength_endurance"],
    items: [
      line("food-oats", 1.5, "breakfast"),
      line("food-whey", 1, "breakfast"),
      line("food-berries", 1, "breakfast"),
      line("food-peanut-butter", 0.5, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-rice", 2.5, "lunch"),
      line("food-broccoli", 1, "lunch"),
      line("food-olive-oil", 0.5, "lunch"),
      line("food-salmon", 1.5, "dinner"),
      line("food-pasta", 2, "dinner"),
      line("food-spinach", 1, "dinner"),
      line("food-cottage", 2, "snack"),
      line("food-banana", 1, "snack"),
    ],
  },
  {
    id: "glute-rebuild",
    name: "Posterior day",
    description: "Protein-forward, enough carbs for hip thrusts, fats from salmon and yogurt — not a 800-kcal salad.",
    goals: ["glute_specialization", "bodybuilding"],
    items: [
      line("food-oats", 1, "breakfast"),
      line("food-greek-yogurt", 2, "breakfast"),
      line("food-berries", 1, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-rice", 1.5, "lunch"),
      line("food-broccoli", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-salmon", 1.5, "dinner"),
      line("food-potato", 2, "dinner"),
      line("food-spinach", 1.5, "dinner"),
      line("food-cottage", 2, "snack"),
      line("food-whey", 1, "snack"),
      line("food-almonds", 0.5, "snack"),
    ],
  },
  {
    id: "stage-fuel",
    name: "Stage fuel",
    description: "Lighter fats, steady carbs, extra protein for pulling and grip. Works on pole or mixed days.",
    goals: ["pole_stage", "exotic_stage", "strength_endurance", "general"],
    items: [
      line("food-oats", 1, "breakfast"),
      line("food-greek-yogurt", 1.5, "breakfast"),
      line("food-banana", 1, "breakfast"),
      line("food-chicken", 1.5, "lunch"),
      line("food-rice", 1.5, "lunch"),
      line("food-spinach", 1, "lunch"),
      line("food-olive-oil", 0.5, "lunch"),
      line("food-salmon", 1, "dinner"),
      line("food-potato", 1.5, "dinner"),
      line("food-broccoli", 1.5, "dinner"),
      line("food-whey", 1, "snack"),
      line("food-apple", 1, "snack"),
      line("food-cottage", 1, "snack"),
    ],
  },
  {
    id: "cut-protein",
    name: "High-protein cut",
    description: "Chicken, yogurt, whey. Rice is there — just less of it. Built for a deficit that still trains.",
    goals: ["bodybuilding", "general", "glute_specialization", "pole_stage"],
    items: [
      line("food-eggs", 1, "breakfast"),
      line("food-greek-yogurt", 2, "breakfast"),
      line("food-berries", 1, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-rice", 1, "lunch"),
      line("food-broccoli", 1.5, "lunch"),
      line("food-spinach", 1, "lunch"),
      line("food-salmon", 1.5, "dinner"),
      line("food-potato", 1, "dinner"),
      line("food-broccoli", 1, "dinner"),
      line("food-cottage", 2, "snack"),
      line("food-whey", 1, "snack"),
      line("food-apple", 1, "snack"),
    ],
  },
  {
    id: "peak-lean",
    name: "Peak plate",
    description: "Protein-forward, predictable carbs, no 'zero food' day. For beach week or a short stage peak.",
    goals: ["bodybuilding", "general", "pole_stage"],
    items: [
      line("food-eggs", 1, "breakfast"),
      line("food-whey", 1, "breakfast"),
      line("food-berries", 1, "breakfast"),
      line("food-chicken", 2.5, "lunch"),
      line("food-rice", 0.5, "lunch"),
      line("food-spinach", 2, "lunch"),
      line("food-broccoli", 1.5, "lunch"),
      line("food-salmon", 1.5, "dinner"),
      line("food-potato", 0.5, "dinner"),
      line("food-spinach", 1.5, "dinner"),
      line("food-cottage", 2, "snack"),
      line("food-whey", 1, "snack"),
    ],
  },
  {
    id: "reverse-plate",
    name: "Reverse plate",
    description: "More rice and oil than the cut plate. The point is to eat again without a weekend wipeout.",
    goals: ["bodybuilding", "general", "glute_specialization"],
    items: [
      line("food-oats", 1, "breakfast"),
      line("food-eggs", 1, "breakfast"),
      line("food-banana", 1, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-rice", 2, "lunch"),
      line("food-broccoli", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-beef", 1.5, "dinner"),
      line("food-potato", 2, "dinner"),
      line("food-spinach", 1, "dinner"),
      line("food-greek-yogurt", 2, "snack"),
      line("food-almonds", 0.5, "snack"),
    ],
  },
  {
    id: "plant-forward",
    name: "Plant-forward",
    description: "Tofu, beans, oats, yogurt. Same calorie math — just less meat if that is the household default.",
    goals: ["general", "pole_stage", "exotic_stage", "glute_specialization", "bodybuilding", "powerlifting", "strength_endurance"],
    items: [
      line("food-oats", 1.5, "breakfast"),
      line("food-greek-yogurt", 2, "breakfast"),
      line("food-berries", 1, "breakfast"),
      line("food-peanut-butter", 0.5, "breakfast"),
      line("food-tofu", 2, "lunch"),
      line("food-rice", 2, "lunch"),
      line("food-beans", 1, "lunch"),
      line("food-broccoli", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-tofu", 1.5, "dinner"),
      line("food-potato", 2, "dinner"),
      line("food-spinach", 1.5, "dinner"),
      line("food-avocado", 0.5, "dinner"),
      line("food-whey", 1, "snack"),
      line("food-apple", 1, "snack"),
    ],
  },
];

export function macrosForLines(items: PlanLine[]) {
  return items.reduce(
    (acc, item) => {
      const food = foodById(item.foodId);
      if (!food) return acc;
      acc.calories += food.calories * item.servings;
      acc.protein += food.protein * item.servings;
      acc.carbs += food.carbs * item.servings;
      acc.fat += food.fat * item.servings;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function snap(n: number) {
  return Math.max(0.5, Math.round(n * 2) / 2);
}

function snapDown(n: number) {
  return Math.max(0.5, Math.floor(n * 2) / 2);
}

function isProteinFood(food: FoodRef) {
  return food.protein >= 10;
}

function isCarbFood(food: FoodRef) {
  return food.carbs >= 15 && food.protein < 12;
}

function isFatFood(food: FoodRef) {
  return food.fat >= 10 && food.protein < 12;
}

export function scalePlanToTargets(template: MealPlanTemplate, calories: number, protein: number): ScaledPlanItem[] {
  const items = template.items.map((i) => ({ ...i }));
  const base = macrosForLines(items);
  if (base.protein > 0) {
    const pScale = protein / base.protein;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (food && isProteinFood(food)) item.servings = snap(item.servings * pScale);
    }
  }

  let current = macrosForLines(items);
  if (current.protein > protein + 6) {
    const trim = protein / current.protein;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (food && isProteinFood(food)) item.servings = snapDown(item.servings * trim);
    }
    current = macrosForLines(items);
  }

  if (current.calories > 0) {
    const cScale = calories / current.calories;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (!food) continue;
      if (isCarbFood(food) || isFatFood(food)) item.servings = snap(item.servings * cScale);
    }
  }

  current = macrosForLines(items);
  const calorieGap = calories - current.calories;
  const rice = items.find((i) => i.foodId === "food-rice");
  const oil = items.find((i) => i.foodId === "food-olive-oil");
  const whey = items.find((i) => i.foodId === "food-whey");
  if (rice && Math.abs(calorieGap) > 80) {
    rice.servings = snap(rice.servings + calorieGap / 130);
  } else if (oil && calorieGap > 80) {
    oil.servings = snap(oil.servings + calorieGap / 119);
  }
  current = macrosForLines(items);
  if (whey && current.protein < protein - 8) {
    whey.servings = snap(whey.servings + (protein - current.protein) / 24);
  }

  current = macrosForLines(items);
  if (current.protein > protein + 3) {
    const trim = protein / current.protein;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (food && isProteinFood(food)) item.servings = snapDown(Math.max(0.5, item.servings * trim));
    }
    current = macrosForLines(items);
  }

  const finalGap = calories - current.calories;
  if (rice && Math.abs(finalGap) > 60) {
    rice.servings = snap(rice.servings + finalGap / 130);
  } else if (oil && finalGap > 60) {
    oil.servings = snap(oil.servings + finalGap / 119);
  }

  return items
    .map((item) => {
      const food = foodById(item.foodId);
      if (!food) return null;
      const servings = snap(item.servings);
      return {
        ...item,
        servings,
        foodName: food.name,
        serving: food.serving,
        calories: food.calories * servings,
        protein: food.protein * servings,
        carbs: food.carbs * servings,
        fat: food.fat * servings,
      };
    })
    .filter((row): row is ScaledPlanItem => row != null);
}

export function getMealPlanTemplate(id: string) {
  return MEAL_PLAN_TEMPLATES.find((p) => p.id === id);
}

export function plansForGoal(goal: Goal) {
  const preferred = MEAL_PLAN_TEMPLATES.filter((p) => p.goals.includes(goal));
  return preferred.length ? preferred : MEAL_PLAN_TEMPLATES.filter((p) => p.goals.includes("general"));
}

export function suggestedPlans(goal: Goal, calories: number, protein: number, dietId?: string | null) {
  const diet = getDiet(dietId);
  const templates = diet
    ? diet.mealPlanIds
        .map((id) => getMealPlanTemplate(id))
        .filter((t): t is MealPlanTemplate => t != null)
    : plansForGoal(goal);
  const spec = goalNutrition(goal);
  return templates.map((template) => {
    const items = scalePlanToTargets(template, calories, protein);
    const totals = items.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return {
      template,
      items,
      totals,
      goalTitle: spec.title,
    };
  });
}
