"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { foods, nutritionLogs } from "@/lib/db/schema";
import { todayISO } from "@/lib/utils";

async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function addFoodLogAction(formData: FormData) {
  const user = await requireUser();
  const foodId = String(formData.get("foodId") || "");
  const meal = String(formData.get("meal") || "lunch");
  const servings = Number(formData.get("servings") || 1);
  const food = db.select().from(foods).where(eq(foods.id, foodId)).get();
  if (!food || !Number.isFinite(servings) || servings <= 0) return;

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
}

export async function addCustomFoodAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const calories = Number(formData.get("calories"));
  const protein = Number(formData.get("protein"));
  const carbs = Number(formData.get("carbs"));
  const fat = Number(formData.get("fat"));
  if (!name || !Number.isFinite(calories)) return;
  const id = crypto.randomUUID();
  db.insert(foods)
    .values({
      id,
      userId: user.id,
      name,
      calories,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      serving: String(formData.get("serving") || "1 serving"),
      favorite: 1,
    })
    .run();
  revalidatePath("/nutrition");
}

export async function deleteFoodLogAction(id: string) {
  const user = await requireUser();
  db.delete(nutritionLogs)
    .where(and(eq(nutritionLogs.id, id), eq(nutritionLogs.userId, user.id)))
    .run();
  revalidatePath("/nutrition");
  revalidatePath("/");
}