import { STARTER_FOODS, foodFitsPattern } from "@/lib/nutrition/foods";
import { goalNutrition } from "@/lib/nutrition/goals";
import { getDiet } from "@/lib/nutrition/diets";
import type { BodyCompGoal, DietaryPattern, Goal } from "@/lib/types";

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
  /** Body-composition phases this plate suits. Omitted = any phase. */
  phases?: BodyCompGoal[];
  items: PlanLine[];
};

const byId = new Map(STARTER_FOODS.map((f) => [f.id, f]));

function foodById(id: string): FoodRef | undefined {
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
    phases: ["gain", "maintain"],
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
    phases: ["gain"],
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
    phases: ["gain", "maintain", "recomp"],
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
    phases: ["maintain", "recomp"],
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
    phases: ["lean"],
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
    phases: ["lean"],
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
    phases: ["maintain", "gain"],
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
    phases: ["maintain", "recomp", "gain"],
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
  {
    id: "low-histamine-plate",
    name: "Fresh-cook plate",
    description:
      "Eggs, chicken, turkey, rice, potato, broccoli, zucchini, apple. Cook and eat the same day, or freeze. No yogurt, cheddar, spinach, or leftover fish.",
    goals: ["general", "pole_stage", "exotic_stage", "bodybuilding"],
    phases: ["maintain", "recomp"],
    items: [
      line("food-oats", 1, "breakfast"),
      line("food-eggs", 1, "breakfast"),
      line("food-apple", 1, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-rice", 2, "lunch"),
      line("food-broccoli", 1.5, "lunch"),
      line("food-carrot", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-turkey", 2, "dinner"),
      line("food-potato", 2, "dinner"),
      line("food-zucchini", 1.5, "dinner"),
      line("food-cucumber", 1, "dinner"),
      line("food-olive-oil", 0.5, "dinner"),
      line("food-blueberries", 1, "snack"),
      line("food-pear", 1, "snack"),
    ],
  },
  {
    id: "low-histamine-oats",
    name: "Fresh-cook training day",
    description:
      "More oats and rice around lifting. Still fresh chicken and turkey — no fermented dairy to 'hit protein.'",
    goals: ["powerlifting", "strength_endurance", "bodybuilding", "general"],
    phases: ["gain", "maintain"],
    items: [
      line("food-oats", 1.5, "breakfast"),
      line("food-eggs", 1.5, "breakfast"),
      line("food-blueberries", 1, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-rice", 2.5, "lunch"),
      line("food-broccoli", 1, "lunch"),
      line("food-zucchini", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-turkey", 1.5, "dinner"),
      line("food-potato", 2, "dinner"),
      line("food-carrot", 1, "dinner"),
      line("food-olive-oil", 0.5, "dinner"),
      line("food-apple", 1, "snack"),
      line("food-rice", 1, "snack"),
    ],
  },
  {
    id: "low-histamine-lighter",
    name: "Fresh-cook lighter plate",
    description:
      "Same low-histamine foods, less starch. Built for the histamine cut, or a quieter day on the maintenance block.",
    goals: ["bodybuilding", "general", "glute_specialization", "pole_stage"],
    phases: ["lean"],
    items: [
      line("food-eggs", 1, "breakfast"),
      line("food-oats", 0.5, "breakfast"),
      line("food-pear", 1, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-rice", 1, "lunch"),
      line("food-broccoli", 2, "lunch"),
      line("food-zucchini", 1.5, "lunch"),
      line("food-carrot", 1, "lunch"),
      line("food-olive-oil", 0.5, "lunch"),
      line("food-turkey", 2, "dinner"),
      line("food-potato", 1, "dinner"),
      line("food-cucumber", 1.5, "dinner"),
      line("food-broccoli", 1, "dinner"),
      line("food-apple", 1, "snack"),
      line("food-blueberries", 1, "snack"),
    ],
  },
  {
    id: "lean-turkey-plate",
    name: "Lean turkey plate",
    description:
      "Egg whites and oats, turkey and sweet potato, cod and vegetables. The leanest protein sources so a deficit still fits real food.",
    goals: ["bodybuilding", "general", "glute_specialization", "pole_stage", "exotic_stage", "powerlifting"],
    phases: ["lean"],
    items: [
      line("food-eggs", 1, "breakfast"),
      line("food-egg-whites", 1, "breakfast"),
      line("food-oats", 1, "breakfast"),
      line("food-blueberries", 1, "breakfast"),
      line("food-turkey", 2, "lunch"),
      line("food-sweet-potato", 1.5, "lunch"),
      line("food-broccoli", 1.5, "lunch"),
      line("food-bell-pepper", 1, "lunch"),
      line("food-olive-oil", 0.5, "lunch"),
      line("food-cod", 2, "dinner"),
      line("food-rice", 1, "dinner"),
      line("food-zucchini", 1.5, "dinner"),
      line("food-olive-oil", 0.5, "dinner"),
      line("food-greek-yogurt", 2, "snack"),
      line("food-apple", 1, "snack"),
    ],
  },
  {
    id: "lean-fish-plate",
    name: "Lean fish plate",
    description: "Pescatarian cut: eggs, cod, shrimp, salmon once, yogurt for the snack. Protein-dense, fats from fish and oil.",
    goals: ["bodybuilding", "general", "glute_specialization", "pole_stage", "exotic_stage"],
    phases: ["lean", "recomp"],
    items: [
      line("food-eggs", 1, "breakfast"),
      line("food-greek-yogurt", 1.5, "breakfast"),
      line("food-berries", 1, "breakfast"),
      line("food-shrimp", 1.5, "lunch"),
      line("food-quinoa", 1.5, "lunch"),
      line("food-spinach", 1, "lunch"),
      line("food-bell-pepper", 1, "lunch"),
      line("food-olive-oil", 0.5, "lunch"),
      line("food-cod", 2, "dinner"),
      line("food-sweet-potato", 1.5, "dinner"),
      line("food-broccoli", 1.5, "dinner"),
      line("food-olive-oil", 0.5, "dinner"),
      line("food-cottage", 2, "snack"),
      line("food-apple", 1, "snack"),
    ],
  },
  {
    id: "plant-lean",
    name: "Plant lean plate",
    description:
      "Vegan cut: tofu, tempeh, lentils, edamame, pea protein. Protein is the hard part on plants — the shake is doing real work here.",
    goals: ["general", "pole_stage", "exotic_stage", "glute_specialization", "bodybuilding", "powerlifting", "strength_endurance"],
    phases: ["lean", "recomp"],
    items: [
      line("food-oats", 1, "breakfast"),
      line("food-pea-protein", 1, "breakfast"),
      line("food-blueberries", 1, "breakfast"),
      line("food-tofu", 2, "lunch"),
      line("food-lentils", 1.5, "lunch"),
      line("food-broccoli", 1.5, "lunch"),
      line("food-bell-pepper", 1, "lunch"),
      line("food-olive-oil", 0.5, "lunch"),
      line("food-tempeh", 1.5, "dinner"),
      line("food-quinoa", 1, "dinner"),
      line("food-zucchini", 1.5, "dinner"),
      line("food-spinach", 1, "dinner"),
      line("food-edamame", 1, "snack"),
      line("food-pea-protein", 1, "snack"),
      line("food-apple", 1, "snack"),
    ],
  },
  {
    id: "plant-gain",
    name: "Plant mass plate",
    description:
      "Vegan surplus: oats and peanut butter, tofu and rice, tempeh and potato, beans, avocado. Carbs carry the surplus; the shake carries protein.",
    goals: ["general", "bodybuilding", "powerlifting", "glute_specialization", "strength_endurance"],
    phases: ["gain", "maintain"],
    items: [
      line("food-oats", 1.5, "breakfast"),
      line("food-pea-protein", 1, "breakfast"),
      line("food-banana", 1, "breakfast"),
      line("food-peanut-butter", 0.5, "breakfast"),
      line("food-tofu", 2, "lunch"),
      line("food-rice", 2.5, "lunch"),
      line("food-beans", 1, "lunch"),
      line("food-broccoli", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-tempeh", 1.5, "dinner"),
      line("food-potato", 2, "dinner"),
      line("food-edamame", 1, "dinner"),
      line("food-avocado", 0.5, "dinner"),
      line("food-pea-protein", 1, "snack"),
      line("food-lentils", 1, "snack"),
      line("food-apple", 1, "snack"),
    ],
  },
  {
    id: "mass-plate",
    name: "Mass plate",
    description:
      "Omnivore surplus: eggs and oats, beef and rice, salmon and potato, a shake with milk. Enough carbs for heavy volume without a dirty bulk.",
    goals: ["bodybuilding", "powerlifting", "glute_specialization", "strength_endurance", "general"],
    phases: ["gain"],
    items: [
      line("food-oats", 1.5, "breakfast"),
      line("food-eggs", 1.5, "breakfast"),
      line("food-banana", 1, "breakfast"),
      line("food-milk", 1, "breakfast"),
      line("food-beef", 2, "lunch"),
      line("food-rice", 2.5, "lunch"),
      line("food-broccoli", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-salmon", 1.5, "dinner"),
      line("food-potato", 2.5, "dinner"),
      line("food-spinach", 1, "dinner"),
      line("food-whey", 1, "snack"),
      line("food-milk", 1, "snack"),
      line("food-peanut-butter", 0.5, "snack"),
    ],
  },
  {
    id: "vegetarian-plate",
    name: "Vegetarian plate",
    description:
      "Eggs, yogurt, tofu, lentils, cottage cheese. Works at maintenance or a small surplus; the whey covers the gap plants leave.",
    goals: ["general", "pole_stage", "exotic_stage", "glute_specialization", "bodybuilding", "strength_endurance", "powerlifting"],
    phases: ["maintain", "recomp", "gain"],
    items: [
      line("food-eggs", 1, "breakfast"),
      line("food-oats", 1, "breakfast"),
      line("food-greek-yogurt", 1.5, "breakfast"),
      line("food-berries", 1, "breakfast"),
      line("food-tofu", 2, "lunch"),
      line("food-quinoa", 1.5, "lunch"),
      line("food-bell-pepper", 1, "lunch"),
      line("food-broccoli", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-lentils", 1.5, "dinner"),
      line("food-rice", 1.5, "dinner"),
      line("food-cheese", 1, "dinner"),
      line("food-spinach", 1, "dinner"),
      line("food-cottage", 2, "snack"),
      line("food-whey", 1, "snack"),
    ],
  },
  {
    id: "vegetarian-lean",
    name: "Vegetarian lean plate",
    description:
      "Egg whites, Greek yogurt, cottage cheese, tofu, whey. The dairy and eggs are what make a vegetarian cut hit protein without a mountain of beans.",
    goals: ["general", "pole_stage", "exotic_stage", "glute_specialization", "bodybuilding"],
    phases: ["lean", "recomp"],
    items: [
      line("food-eggs", 1, "breakfast"),
      line("food-egg-whites", 1, "breakfast"),
      line("food-oats", 0.5, "breakfast"),
      line("food-blueberries", 1, "breakfast"),
      line("food-tofu", 2, "lunch"),
      line("food-quinoa", 1, "lunch"),
      line("food-broccoli", 1.5, "lunch"),
      line("food-bell-pepper", 1, "lunch"),
      line("food-olive-oil", 0.5, "lunch"),
      line("food-cottage", 2, "dinner"),
      line("food-lentils", 1, "dinner"),
      line("food-zucchini", 1.5, "dinner"),
      line("food-spinach", 1, "dinner"),
      line("food-greek-yogurt", 1.5, "snack"),
      line("food-whey", 1, "snack"),
      line("food-apple", 1, "snack"),
    ],
  },
  {
    id: "fish-rice-plate",
    name: "Fish and rice plate",
    description:
      "Pescatarian surplus or hold: eggs and oats, tuna and rice, salmon and potato, yogurt with fruit. Fats come from the fish, carbs carry the training.",
    goals: ["bodybuilding", "powerlifting", "glute_specialization", "strength_endurance", "general", "pole_stage"],
    phases: ["gain", "maintain"],
    items: [
      line("food-oats", 1.5, "breakfast"),
      line("food-eggs", 1, "breakfast"),
      line("food-banana", 1, "breakfast"),
      line("food-tuna", 1.5, "lunch"),
      line("food-rice", 2.5, "lunch"),
      line("food-edamame", 1, "lunch"),
      line("food-olive-oil", 1, "lunch"),
      line("food-salmon", 1.5, "dinner"),
      line("food-potato", 2, "dinner"),
      line("food-broccoli", 1, "dinner"),
      line("food-greek-yogurt", 2, "snack"),
      line("food-berries", 1, "snack"),
      line("food-peanut-butter", 0.5, "snack"),
    ],
  },
  {
    id: "low-histamine-lean",
    name: "Fresh-cook lean plate",
    description:
      "Egg whites, chicken, turkey, sweet potato, zucchini, pear. Every food is low-histamine and lean, so a histamine cut still reaches protein.",
    goals: ["bodybuilding", "general", "glute_specialization", "pole_stage", "exotic_stage"],
    phases: ["lean"],
    items: [
      line("food-eggs", 1, "breakfast"),
      line("food-egg-whites", 1, "breakfast"),
      line("food-oats", 0.5, "breakfast"),
      line("food-pear", 1, "breakfast"),
      line("food-chicken", 2, "lunch"),
      line("food-sweet-potato", 1.5, "lunch"),
      line("food-zucchini", 1.5, "lunch"),
      line("food-carrot", 1, "lunch"),
      line("food-olive-oil", 0.5, "lunch"),
      line("food-turkey", 2, "dinner"),
      line("food-rice", 1, "dinner"),
      line("food-broccoli", 1.5, "dinner"),
      line("food-cucumber", 1, "dinner"),
      line("food-olive-oil", 0.5, "dinner"),
      line("food-apple", 1, "snack"),
      line("food-blueberries", 1, "snack"),
    ],
  },
];

/** Food ids that a template uses, deduplicated. */
export function templateFoodIds(template: MealPlanTemplate) {
  return [...new Set(template.items.map((i) => i.foodId))];
}

/** A template fits a dietary pattern when every food in it does. */
export function templateFitsPattern(template: MealPlanTemplate, pattern: DietaryPattern) {
  return template.items.every((item) => {
    const food = foodById(item.foodId);
    return food ? foodFitsPattern(food, pattern) : false;
  });
}

export function templateIsLowHistamine(template: MealPlanTemplate) {
  return template.items.every((item) => foodById(item.foodId)?.histamine === "low");
}

function macrosForLines(items: PlanLine[]) {
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

function snap(n: number, min = 0) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(min, Math.round(n * 2) / 2);
}

function isProteinFood(food: FoodRef) {
  return food.protein >= 10;
}

/**
 * Reduce protein overshoot by cutting half-serving steps from protein lines.
 * A multiplicative trim that floors every line compounds to a big undershoot
 * (each line loses up to 0.5 servings); stepwise cuts stay near the target.
 */
function trimProteinLines(items: PlanLine[], targetProtein: number, tolerance: number) {
  for (let guard = 0; guard < 60; guard++) {
    const excess = macrosForLines(items).protein - targetProtein;
    if (excess <= tolerance) return;
    let best: { item: PlanLine; step: number } | null = null;
    let smallest: { item: PlanLine; step: number } | null = null;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (!food || !isProteinFood(food) || item.servings < 0.5) continue;
      const step = food.protein * 0.5;
      if (step <= excess + tolerance && (!best || step > best.step)) best = { item, step };
      if (!smallest || step < smallest.step) smallest = { item, step };
    }
    // Prefer the biggest cut that stays inside tolerance; otherwise take the
    // smallest available cut only if it brings us closer to the target.
    const cut = best ?? (smallest && Math.abs(excess - smallest.step) < excess ? smallest : null);
    if (!cut) return;
    cut.item.servings = Math.round((cut.item.servings - 0.5) * 2) / 2;
  }
}

function isCarbFood(food: FoodRef) {
  return food.carbs >= 15 && food.protein < 12;
}

function isFatFood(food: FoodRef) {
  return food.fat >= 10 && food.protein < 12;
}

function stepwiseTrim(
  items: PlanLine[],
  shouldContinue: (macros: ReturnType<typeof macrosForLines>) => boolean,
  eligible: (food: FoodRef, macros: ReturnType<typeof macrosForLines>) => boolean,
) {
  for (let guard = 0; guard < 80; guard++) {
    const macros = macrosForLines(items);
    if (!shouldContinue(macros)) return;
    let best: { item: PlanLine; calStep: number } | null = null;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (!food || item.servings < 0.5) continue;
      if (!eligible(food, macros)) continue;
      const calStep = food.calories * 0.5;
      if (!best || calStep > best.calStep) best = { item, calStep };
    }
    if (!best) return;
    best.item.servings = Math.round((best.item.servings - 0.5) * 2) / 2;
  }
}

function ensureLine(items: PlanLine[], foodId: string, meal: MealSlot) {
  const existing = items.find((item) => item.foodId === foodId);
  if (existing) return existing;
  const created: PlanLine = { foodId, servings: 0, meal };
  items.push(created);
  return created;
}

/**
 * The leanest protein source already on the plate (fewest kcal per gram of
 * protein). Only template foods qualify, so a vegan or low-histamine plate
 * never grows a turkey line.
 */
function leanestProteinInPlan(items: PlanLine[]): FoodRef | null {
  let best: FoodRef | null = null;
  for (const item of items) {
    const food = foodById(item.foodId);
    if (!food || !isProteinFood(food)) continue;
    const density = food.calories / Math.max(0.1, food.protein);
    if (!best || density < best.calories / Math.max(0.1, best.protein)) best = food;
  }
  return best;
}

/** Move protein grams onto the plate's leanest protein so a high-protein cut can still fit calories. */
function shiftProteinToLean(items: PlanLine[], targetCalories: number, calorieTol: number) {
  const leanFood = leanestProteinInPlan(items);
  if (!leanFood) return;
  const lean = leanFood.id;
  const leanLine = ensureLine(items, lean, "snack");
  for (let guard = 0; guard < 40; guard++) {
    const macros = macrosForLines(items);
    if (macros.calories <= targetCalories + calorieTol) return;
    let worst: { item: PlanLine; food: FoodRef; density: number } | null = null;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (!food || !isProteinFood(food) || item.foodId === lean || item.servings < 0.5) continue;
      const density = food.calories / Math.max(0.1, food.protein);
      if (!worst || density > worst.density) worst = { item, food, density };
    }
    if (!worst) return;
    worst.item.servings = Math.round((worst.item.servings - 0.5) * 2) / 2;
    leanLine.servings = snap(leanLine.servings + (worst.food.protein * 0.5) / leanFood.protein);
  }
}

function addProteinWithinCalories(
  items: PlanLine[],
  targetCalories: number,
  targetProtein: number,
  calorieTol: number,
) {
  const macros = macrosForLines(items);
  if (macros.protein >= targetProtein - 8) return;
  const fillerFood = leanestProteinInPlan(items);
  if (!fillerFood) return;
  const fillerId = fillerFood.id;
  const line = ensureLine(items, fillerId, "snack");
  const need = targetProtein - macros.protein;
  const add = need / Math.max(1, fillerFood.protein);
  const projected = macros.calories + add * fillerFood.calories;
  if (projected <= targetCalories + calorieTol) {
    line.servings = snap(line.servings + add, 0.5);
    return;
  }
  const room = targetCalories + calorieTol - macros.calories;
  if (room > 0 && fillerFood.calories > 0) {
    line.servings = snap(line.servings + room / fillerFood.calories);
  }
}

/**
 * Close an under-target gap with the plate's main starch (largest carb line) so
 * extra calories land where the template already puts carbs; fall back to oil.
 */
function fillCalorieGap(items: PlanLine[], targetCalories: number, tolerance: number) {
  const gap = targetCalories - macrosForLines(items).calories;
  if (gap <= tolerance) return;
  // Prefer starches that carry little protein (rice, oats, quinoa, potato) so a
  // big gap does not become fifteen servings of lentils and 40 g of extra
  // protein; fall back to any carb line, then oil.
  const starches = items
    .map((item) => ({ item, food: foodById(item.foodId) }))
    .filter((row): row is { item: PlanLine; food: FoodRef } => Boolean(row.food && isCarbFood(row.food) && row.food.calories > 0))
    .sort((a, b) => b.item.servings - a.item.servings);
  const lowProtein = starches.filter((row) => row.food.protein / row.food.calories < 0.05 && row.food.carbs >= 20);
  const pool = (lowProtein.length ? lowProtein : starches).slice(0, gap > 300 ? 2 : 1);
  if (pool.length) {
    const share = gap / pool.length;
    for (const row of pool) row.item.servings = snap(row.item.servings + share / row.food.calories);
    return;
  }
  const oil = items.find((i) => i.foodId === "food-olive-oil");
  if (oil) oil.servings = snap(oil.servings + gap / 119);
}

export function scalePlanToTargets(template: MealPlanTemplate, calories: number, protein: number): ScaledPlanItem[] {
  const items = template.items.map((i) => ({ ...i }));
  const base = macrosForLines(items);
  if (base.protein > 0) {
    const pScale = protein / base.protein;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (food && isProteinFood(food)) item.servings = snap(item.servings * pScale, 0.5);
    }
  }

  trimProteinLines(items, protein, 6);

  const current = macrosForLines(items);
  if (current.calories > 0) {
    const cScale = calories / current.calories;
    for (const item of items) {
      const food = foodById(item.foodId);
      if (!food) continue;
      if (isCarbFood(food) || isFatFood(food)) item.servings = snap(item.servings * cScale);
    }
  }

  const calorieTol = 80;
  stepwiseTrim(
    items,
    (macros) => macros.calories > calories + calorieTol,
    (food) => !isProteinFood(food),
  );
  shiftProteinToLean(items, calories, calorieTol);

  fillCalorieGap(items, calories, calorieTol);

  addProteinWithinCalories(items, calories, protein, 120);
  trimProteinLines(items, protein, 3);
  stepwiseTrim(
    items,
    (macros) => macros.calories > calories + 60 && macros.protein >= protein - 8,
    (food) => !isProteinFood(food),
  );
  addProteinWithinCalories(items, calories, protein, 120);
  fillCalorieGap(items, calories, calorieTol);

  return items
    .map((item) => {
      const food = foodById(item.foodId);
      if (!food) return null;
      const servings = snap(item.servings);
      if (servings <= 0) return null;
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

export function planTotals(items: ScaledPlanItem[]) {
  return items.reduce(
    (acc, item) => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export type PlanFilter = {
  goal: Goal;
  phase?: BodyCompGoal | null;
  pattern?: DietaryPattern;
  lowHistamine?: boolean;
  dietId?: string | null;
};

/**
 * Templates that fit the person: dietary pattern is a hard filter, low-histamine
 * is a hard filter when the block asks for it, body-comp phase is preferred and
 * training goal breaks ties. Falls back progressively so the list is never empty
 * unless the pattern itself has no plates (which the catalog prevents).
 */
export function templatesFor(filter: PlanFilter): MealPlanTemplate[] {
  const pattern = filter.pattern ?? "omnivore";
  const diet = getDiet(filter.dietId);
  const base = MEAL_PLAN_TEMPLATES.filter((t) => templateFitsPattern(t, pattern)).filter((t) =>
    filter.lowHistamine ? templateIsLowHistamine(t) : true,
  );
  if (base.length === 0) return [];

  const phase = filter.phase ?? null;
  const dietIds = diet ? new Set(diet.mealPlanIds) : null;
  const score = (t: MealPlanTemplate) => {
    let s = 0;
    if (dietIds?.has(t.id)) s += 4;
    if (phase && t.phases?.includes(phase)) s += 3;
    if (phase && !t.phases) s += 1;
    if (t.goals.includes(filter.goal)) s += 2;
    return s;
  };
  const scored = base.map((t) => ({ t, s: score(t) })).sort((a, b) => b.s - a.s);
  const top = scored[0]?.s ?? 0;
  // Keep everything within one point of the best fit so weekly rotation has variety;
  // never keep a plate tagged for the opposite phase when better ones exist.
  const opposite = (t: MealPlanTemplate) =>
    phase === "lean" ? t.phases?.every((p) => p === "gain") : phase === "gain" ? t.phases?.every((p) => p === "lean") : false;
  const kept = scored.filter((row) => row.s >= top - 1 && !opposite(row.t)).map((row) => row.t);
  return kept.length ? kept : scored.slice(0, 3).map((row) => row.t);
}

export function suggestedPlans(goal: Goal, calories: number, protein: number, dietId?: string | null, filter?: Omit<PlanFilter, "goal" | "dietId">) {
  const templates = templatesFor({ goal, dietId, ...filter });
  const spec = goalNutrition(goal);
  return templates.map((template) => {
    const items = scalePlanToTargets(template, calories, protein);
    return {
      template,
      items,
      totals: planTotals(items),
      goalTitle: spec.title,
    };
  });
}

/**
 * Fold the snack slot into the main meals when someone eats three times a day.
 * Dairy, shakes, and fruit go to breakfast; everything else to dinner. Protein
 * per meal stays close to even (Mamerow 2014; Schoenfeld & Aragon 2018).
 */
export function foldToMealsPerDay(items: ScaledPlanItem[], mealsPerDay: number): ScaledPlanItem[] {
  if (mealsPerDay >= 4) return items;
  return items.map((item) => {
    if (item.meal !== "snack") return item;
    const food = foodById(item.foodId);
    const toBreakfast = food ? food.kind === "dairy" || (food.kind === "plant" && food.carbs >= 10 && food.protein < 5) || /protein/i.test(food.name) : false;
    return { ...item, meal: toBreakfast ? "breakfast" : "dinner" };
  });
}

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type WeeklyPlanDay = {
  day: (typeof WEEK_DAYS)[number];
  template: MealPlanTemplate;
  items: ScaledPlanItem[];
  totals: ReturnType<typeof planTotals>;
};

export type GroceryLine = {
  foodId: string;
  foodName: string;
  serving: string;
  servings: number;
};

/**
 * Seven scaled days rotating through the fitting templates. Rotation order is
 * deterministic so the plan looks the same on every visit; the offset lets the
 * user shuffle which plate lands on Monday.
 */
export function weeklyPlan(input: {
  filter: PlanFilter;
  calories: number;
  protein: number;
  mealsPerDay: number;
  offset?: number;
}): { days: WeeklyPlanDay[]; grocery: GroceryLine[]; templates: MealPlanTemplate[] } {
  const templates = templatesFor(input.filter);
  if (templates.length === 0) return { days: [], grocery: [], templates: [] };
  const offset = ((input.offset ?? 0) % templates.length + templates.length) % templates.length;
  const cache = new Map<string, ScaledPlanItem[]>();
  const days: WeeklyPlanDay[] = WEEK_DAYS.map((day, i) => {
    const template = templates[(i + offset) % templates.length];
    let items = cache.get(template.id);
    if (!items) {
      items = foldToMealsPerDay(scalePlanToTargets(template, input.calories, input.protein), input.mealsPerDay);
      cache.set(template.id, items);
    }
    return { day, template, items, totals: planTotals(items) };
  });
  const grocery = new Map<string, GroceryLine>();
  for (const d of days) {
    for (const item of d.items) {
      const row = grocery.get(item.foodId) ?? { foodId: item.foodId, foodName: item.foodName, serving: item.serving, servings: 0 };
      row.servings = Math.round((row.servings + item.servings) * 2) / 2;
      grocery.set(item.foodId, row);
    }
  }
  return {
    days,
    grocery: [...grocery.values()].sort((a, b) => b.servings - a.servings),
    templates,
  };
}
