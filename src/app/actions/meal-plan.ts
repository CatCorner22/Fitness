"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { BODY_COMP_GOALS } from "@/lib/nutrition/body-comp";
import { revalidateNutrition } from "@/lib/revalidate";
import { clampInt, formString, pickEnum } from "@/lib/utils";
import type { BodyCompGoal, DietaryPattern } from "@/lib/types";

const PATTERNS: readonly DietaryPattern[] = ["omnivore", "pescatarian", "vegetarian", "vegan"];

/** Optional body-fat estimate. Blank clears it; anything outside 3–60% is ignored. */
function optionalBodyFat(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 3 || n > 60) return null;
  return Math.round(n * 10) / 10;
}

export async function saveBodyCompAction(formData: FormData) {
  const user = await requireUser();
  const existing = db.select().from(profiles).where(eq(profiles.userId, user.id)).get();
  if (!existing) redirect("/onboarding");

  const goalRaw = formString(formData, "bodyCompGoal");
  const goal: BodyCompGoal | null = (BODY_COMP_GOALS as readonly string[]).includes(goalRaw)
    ? (goalRaw as BodyCompGoal)
    : (existing.bodyCompGoal as BodyCompGoal | null);

  // A band pick fills in a representative number unless an exact value was typed.
  const exact = optionalBodyFat(formData.get("bodyFatPct"));
  const band = optionalBodyFat(formData.get("bodyFatBand"));
  const clearBodyFat = formString(formData, "bodyFatBand") === "clear";
  const bodyFatPct = clearBodyFat ? null : exact ?? band ?? (formData.has("bodyFatPct") ? null : existing.bodyFatPct);

  db.update(profiles)
    .set({
      bodyCompGoal: goal,
      bodyFatPct,
      mealsPerDay: clampInt(formData.get("mealsPerDay"), existing.mealsPerDay ?? 4, 3, 6),
      dietaryPattern: pickEnum(formData.get("dietaryPattern"), PATTERNS, (existing.dietaryPattern as DietaryPattern) || "omnivore"),
    })
    .where(eq(profiles.userId, user.id))
    .run();

  revalidateNutrition();
  redirect("/meal-plan?toast=meal-plan");
}
