"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getDiet } from "@/lib/nutrition/diets";
import { todayISO } from "@/lib/utils";

async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

function refreshDiet() {
  revalidatePath("/");
  revalidatePath("/nutrition");
  revalidatePath("/diets");
  revalidatePath("/settings");
  revalidatePath("/progress");
}

export async function enrollDietAction(dietId: string) {
  const user = await requireUser();
  const diet = getDiet(dietId);
  if (!diet) return;
  db.update(profiles)
    .set({
      activeDietId: diet.id,
      dietStartDate: todayISO(),
      dietWeek: 1,
    })
    .where(eq(profiles.userId, user.id))
    .run();
  refreshDiet();
  redirect("/nutrition?toast=diet");
}

export async function clearDietAction() {
  const user = await requireUser();
  db.update(profiles)
    .set({
      activeDietId: null,
      dietStartDate: null,
      dietWeek: 1,
    })
    .where(eq(profiles.userId, user.id))
    .run();
  refreshDiet();
  redirect("/nutrition?toast=diet-off");
}

export async function setDietStartAction(formData: FormData) {
  const user = await requireUser();
  const date = String(formData.get("dietStartDate") || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  db.update(profiles)
    .set({ dietStartDate: date })
    .where(eq(profiles.userId, user.id))
    .run();
  refreshDiet();
  redirect("/nutrition?toast=diet");
}
