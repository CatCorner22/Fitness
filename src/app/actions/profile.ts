"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyweightLogs, dailyCheckins, profiles, users } from "@/lib/db/schema";
import { todayISO } from "@/lib/utils";
import { programForGoal } from "@/lib/copy";
import { getProgram } from "@/lib/programs/catalog";
import { getDiet } from "@/lib/nutrition/diets";
import { setPrefCookies } from "@/lib/prefs";

async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function saveOnboardingAction(formData: FormData) {
  const user = await requireUser();
  const goal = String(formData.get("goal") || "general");
  const programId = String(formData.get("programId") || programForGoal(goal));
  const program = getProgram(programId);
  const weight = Number(formData.get("weight"));
  const height = Number(formData.get("height"));
  const units = String(formData.get("units") || "lb") as "lb" | "kg";
  const weightKg = Number.isFinite(weight) && weight > 0 ? (units === "lb" ? weight / 2.20462 : weight) : null;
  const heightCm = Number.isFinite(height) && height > 0 ? (units === "lb" ? height * 2.54 : height) : null;

  db.update(profiles)
    .set({
      goal,
      experience: String(formData.get("experience") || "novice"),
      daysPerWeek: Number(formData.get("daysPerWeek") || 3),
      sessionMinutes: Number(formData.get("sessionMinutes") || 45),
      injuries: JSON.stringify(formData.getAll("injuries")),
      units,
      persona: String(formData.get("persona") || "scientist"),
      sex: String(formData.get("sex") || "unspecified"),
      age: Number(formData.get("age")) || null,
      heightCm,
      weightKg,
      onboarded: 0,
      activeProgramId: program?.id ?? "upper_lower",
      programStartDate: todayISO(),
      currentWeek: 1,
    })
    .where(eq(profiles.userId, user.id))
    .run();

  db.update(users)
    .set({ displayName: String(formData.get("displayName") || user.displayName) })
    .where(eq(users.id, user.id))
    .run();

  if (weightKg) {
    db.insert(bodyweightLogs)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        date: todayISO(),
        weightKg,
      })
      .run();
  }

  revalidatePath("/");
  redirect("/onboarding/assess");
}

export async function saveSettingsAction(formData: FormData) {
  const user = await requireUser();
  const units = String(formData.get("units") || "lb") as "lb" | "kg";
  const weight = Number(formData.get("weight"));
  const height = Number(formData.get("height"));
  const weightKg = Number.isFinite(weight) && weight > 0 ? (units === "lb" ? weight / 2.20462 : weight) : null;
  const heightCm = Number.isFinite(height) && height > 0 ? (units === "lb" ? height * 2.54 : height) : null;
  const programId = String(formData.get("programId") || "");
  const existing = db.select().from(profiles).where(eq(profiles.userId, user.id)).get();
  const dietField = formData.get("dietId");
  const nextDietId =
    dietField === null ? existing?.activeDietId ?? null : String(dietField) || null;
  const dietChanged = nextDietId !== (existing?.activeDietId ?? null);
  const validDiet = nextDietId && getDiet(nextDietId) ? nextDietId : null;

  db.update(profiles)
    .set({
      sessionMinutes: Number(formData.get("sessionMinutes") || 60),
      daysPerWeek: Number(formData.get("daysPerWeek") || 4),
      injuries: JSON.stringify(formData.getAll("injuries")),
      units,
      persona: String(formData.get("persona") || "scientist"),
      sex: String(formData.get("sex") || existing?.sex || "unspecified"),
      age: Number(formData.get("age")) || existing?.age || null,
      heightCm: heightCm ?? existing?.heightCm ?? null,
      weightKg: weightKg ?? existing?.weightKg ?? null,
      experience: String(formData.get("experience") || existing?.experience || "novice"),
      goal: String(formData.get("goal") || existing?.goal || "general"),
      activeProgramId: programId || existing?.activeProgramId,
      programStartDate:
        programId && programId !== existing?.activeProgramId ? todayISO() : existing?.programStartDate,
      currentWeek: programId && programId !== existing?.activeProgramId ? 1 : existing?.currentWeek ?? 1,
      activeDietId: validDiet,
      dietStartDate: dietChanged ? (validDiet ? todayISO() : null) : existing?.dietStartDate ?? null,
      dietWeek: dietChanged ? 1 : existing?.dietWeek ?? 1,
      equipment: JSON.stringify(
        formData.getAll("equipment").length
          ? formData.getAll("equipment")
          : ["bodyweight"],
      ),
    })
    .where(eq(profiles.userId, user.id))
    .run();

  db.update(users)
    .set({ displayName: String(formData.get("displayName") || user.displayName) })
    .where(eq(users.id, user.id))
    .run();

  await setPrefCookies(
    String(formData.get("aiOptIn") || "") === "1",
    String(formData.get("theme") || "") === "light" ? "light" : "dark",
  );

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/nutrition");
  revalidatePath("/diets");
  redirect("/settings?toast=settings");
}

export async function advanceWeekAction() {
  const user = await requireUser();
  const existing = db.select().from(profiles).where(eq(profiles.userId, user.id)).get();
  if (!existing) return;
  const program = existing.activeProgramId ? getProgram(existing.activeProgramId) : null;
  const next = (existing.currentWeek ?? 1) + 1;
  const wrapped = program && next > program.durationWeeks ? 1 : next;
  db.update(profiles)
    .set({ currentWeek: wrapped })
    .where(eq(profiles.userId, user.id))
    .run();
  revalidatePath("/");
}

export async function enrollProgramAction(programId: string) {
  const user = await requireUser();
  const program = getProgram(programId);
  if (!program) return;
  const existing = getProfile(user.id);
  const keepGoal = existing && program.recommendedFor.includes(existing.goal);
  db.update(profiles)
    .set({
      activeProgramId: program.id,
      programStartDate: todayISO(),
      currentWeek: 1,
      goal: keepGoal ? existing.goal : (program.recommendedFor[0] ?? "general"),
    })
    .where(eq(profiles.userId, user.id))
    .run();
  revalidatePath("/");
  revalidatePath("/programs");
}

export async function logBodyweightAction(formData: FormData) {
  const user = await requireUser();
  const profile = db.select().from(profiles).where(eq(profiles.userId, user.id)).get();
  const units = (profile?.units ?? "lb") as "lb" | "kg";
  const raw = Number(formData.get("weight"));
  if (!Number.isFinite(raw) || raw <= 0) return;
  const weightKg = units === "lb" ? raw / 2.20462 : raw;
  db.insert(bodyweightLogs)
    .values({ id: crypto.randomUUID(), userId: user.id, date: todayISO(), weightKg })
    .run();
  db.update(profiles).set({ weightKg }).where(eq(profiles.userId, user.id)).run();
  revalidatePath("/");
  revalidatePath("/nutrition");
  revalidatePath("/progress");
  redirect("/?toast=weight");
}

export async function logCheckinAction(formData: FormData) {
  const user = await requireUser();
  const date = todayISO();
  const existing = db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.userId, user.id))
    .all()
    .find((c) => c.date === date);
  const payload = {
    sleepHours: Number(formData.get("sleepHours")) || null,
    fatigue: Number(formData.get("fatigue")) || null,
    notes: String(formData.get("notes") || "") || null,
  };
  if (existing) {
    db.update(dailyCheckins).set(payload).where(eq(dailyCheckins.id, existing.id)).run();
  } else {
    db.insert(dailyCheckins)
      .values({ id: crypto.randomUUID(), userId: user.id, date, ...payload })
      .run();
  }
  revalidatePath("/");
  redirect("/?toast=checkin");
}