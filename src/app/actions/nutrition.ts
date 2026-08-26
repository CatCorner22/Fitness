"use server";

import { and, eq, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { foods, nutritionLogs } from "@/lib/db/schema";
import { getMealPlanTemplate, scalePlanToTargets } from "@/lib/nutrition/meal-plans";
import { adaptiveCalories } from "@/lib/nutrition/targets";
import { todayNutrition, yesterdayISO } from "@/lib/today";
import { clamp, todayISO } from "@/lib/utils";

const MEALS = new Set(["breakfast", "lunch", "dinner", "snack"]);

async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function addFoodLogAction(formData: FormData) {
  const user = await requireUser();
  const foodId = String(formData.get("foodId") || "");
  const meal = String(formData.get("meal") || "lunch");
  if (!MEALS.has(meal)) return;
  const servingsRaw = Number(formData.get("servings") || 1);
  if (!Number.isFinite(servingsRaw) || servingsRaw <= 0) return;
  const servings = Math.round(clamp(servingsRaw, 0.25, 20) * 100) / 100;
  const food = db
    .select()
    .from(foods)
    .where(and(eq(foods.id, foodId), or(isNull(foods.userId), eq(foods.userId, user.id))))
    .get();
  if (!food) return;

  db.insert(nutritionLogs)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      date: todayISO(),
      meal,
      foodId: food.id,
      foodName: food.name,
      calories: food.calories * servings,
      protein: food.protein * servings,
      carbs: food.carbs * servings,
      fat: food.fat * servings,
      servings,
    })
    .run();
  revalidatePath("/nutrition");
  revalidatePath("/");
  redirect("/nutrition?toast=food");
}

function macroGrams(raw: unknown) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return clamp(n, 0, 500);
}

export async function addCustomFoodAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const calories = Number(formData.get("calories"));
  if (!name || !Number.isFinite(calories) || calories < 0 || calories > 5000) return;
  const id = crypto.randomUUID();
  db.insert(foods)
    .values({
      id,
      userId: user.id,
      name,
      calories,
      protein: macroGrams(formData.get("protein")),
      carbs: macroGrams(formData.get("carbs")),
      fat: macroGrams(formData.get("fat")),
      serving: String(formData.get("serving") || "1 serving").trim().slice(0, 40) || "1 serving",
      favorite: 1,
    })
    .run();
  revalidatePath("/nutrition");
}

export async function applyMealPlanAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId") || "");
  const replace = String(formData.get("replace") || "") === "1";
  const profile = getProfile(user.id);
  if (!profile) redirect("/onboarding");

  const targets = adaptiveCalories(user.id, profile);
  const template = getMealPlanTemplate(planId);
  if (!template) redirect("/nutrition?toast=plan-missing");
  const items = scalePlanToTargets(template, targets.calories, targets.protein);

  const date = todayISO();
  const existing = todayNutrition(user.id);
  const filledMeals = new Set(existing.logs.map((l) => l.meal));

  let inserted = 0;
  db.transaction((tx) => {
    if (replace) {
      tx.delete(nutritionLogs)
        .where(and(eq(nutritionLogs.userId, user.id), eq(nutritionLogs.date, date)))
        .run();
    }

    for (const item of items) {
      if (!replace && filledMeals.has(item.meal)) continue;
      tx.insert(nutritionLogs)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          date,
          meal: item.meal,
          foodId: item.foodId,
          foodName: item.foodName,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          servings: item.servings,
        })
        .run();
      inserted++;
    }
  });

  revalidatePath("/nutrition");
  revalidatePath("/");
  redirect(inserted > 0 ? "/nutrition?toast=food" : "/nutrition?toast=plan-full");
}

export async function copyYesterdayFoodAction() {
  const user = await requireUser();
  const today = todayISO();
  const yesterday = yesterdayISO();
  const existing = todayNutrition(user.id);
  const filledMeals = new Set(existing.logs.map((l) => l.meal));
  const prior = db
    .select()
    .from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, user.id), eq(nutritionLogs.date, yesterday)))
    .all();
  if (prior.length === 0) redirect("/nutrition?toast=yesterday-empty");

  let inserted = 0;
  db.transaction((tx) => {
    for (const item of prior) {
      if (filledMeals.has(item.meal)) continue;
      tx.insert(nutritionLogs)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          date: today,
          meal: item.meal,
          foodId: item.foodId,
          foodName: item.foodName,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          servings: item.servings,
        })
        .run();
      inserted++;
    }
  });

  revalidatePath("/nutrition");
  revalidatePath("/");
  redirect(inserted > 0 ? "/nutrition?toast=food" : "/nutrition?toast=plan-full");
}

export async function deleteFoodLogAction(id: string) {
  const user = await requireUser();
  db.delete(nutritionLogs)
    .where(and(eq(nutritionLogs.id, id), eq(nutritionLogs.userId, user.id)))
    .run();
  revalidatePath("/nutrition");
  revalidatePath("/");
}
