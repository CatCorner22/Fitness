"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyweightLogs, dailyCheckins, profiles, users } from "@/lib/db/schema";
import { clampInt, displayHeightToCm, displayWeightToKg, formString, optionalCheckinInt, pickEnum, todayISO } from "@/lib/utils";
import { programForGoal } from "@/lib/copy";
import { getProgram } from "@/lib/programs/catalog";
import { listedEquipment } from "@/lib/equipment";
import { getDiet } from "@/lib/nutrition/diets";
import { getTheme, setPrefCookies } from "@/lib/prefs";
import type { Experience, Goal, Injury, Persona, Units } from "@/lib/types";

const GOALS: Goal[] = [
  "powerlifting",
  "bodybuilding",
  "strength_endurance",
  "pole_stage",
  "exotic_stage",
  "glute_specialization",
  "general",
];
const EXPERIENCES: Experience[] = ["novice", "intermediate", "advanced"];
const PERSONAS: Persona[] = ["scientist", "garanimal"];
const SEXES = ["female", "male", "unspecified"] as const;
const UNITS: Units[] = ["lb", "kg"];
const INJURIES: Injury[] = ["shoulder", "knee", "low_back", "wrist", "elbow", "hip", "ankle"];

function listedInjuries(formData: FormData) {
  return formData
    .getAll("injuries")
    .map(String)
    .filter((item): item is Injury => INJURIES.includes(item as Injury));
}

function optionalAge(raw: unknown) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return clampInt(n, 0, 15, 99);
}

function upsertBodyweight(userId: string, weightKg: number, date = todayISO()) {
  const existingBw = db
    .select()
    .from(bodyweightLogs)
    .where(and(eq(bodyweightLogs.userId, userId), eq(bodyweightLogs.date, date)))
    .get();
  if (existingBw) {
    db.update(bodyweightLogs)
      .set({ weightKg })
      .where(and(eq(bodyweightLogs.id, existingBw.id), eq(bodyweightLogs.userId, userId)))
      .run();
  } else {
    db.insert(bodyweightLogs)
      .values({ id: crypto.randomUUID(), userId, date, weightKg })
      .run();
  }
}

export async function saveOnboardingAction(formData: FormData) {
  const user = await requireUser();
  const goal = pickEnum(formData.get("goal"), GOALS, "general");
  const programId = formString(formData, "programId") || programForGoal(goal);
  const program = getProgram(programId);
  const units = pickEnum(formData.get("units"), UNITS, "lb");
  const weightKg = displayWeightToKg(Number(formData.get("weight")), units);
  const heightCm = displayHeightToCm(Number(formData.get("height")), units);
  const fields = {
    goal,
    experience: pickEnum(formData.get("experience"), EXPERIENCES, "novice"),
    daysPerWeek: clampInt(formData.get("daysPerWeek"), 3, 2, 7),
    sessionMinutes: clampInt(formData.get("sessionMinutes"), 45, 20, 180),
    injuries: JSON.stringify(listedInjuries(formData)),
    units,
    persona: pickEnum(formData.get("persona"), PERSONAS, "scientist"),
    sex: pickEnum(formData.get("sex"), SEXES, "unspecified"),
    age: optionalAge(formData.get("age")),
    heightCm,
    weightKg,
    onboarded: 0,
    activeProgramId: program?.id ?? "upper_lower",
    programStartDate: todayISO(),
    currentWeek: 1,
    equipment: listedEquipment(formData, ["bodyweight", "dumbbell"]),
  };

  const existing = db.select().from(profiles).where(eq(profiles.userId, user.id)).get();
  if (existing) {
    db.update(profiles).set(fields).where(eq(profiles.userId, user.id)).run();
  } else {
    db.insert(profiles).values({ userId: user.id, ...fields }).run();
  }

  db.update(users)
    .set({ displayName: formString(formData, "displayName") || user.displayName })
    .where(eq(users.id, user.id))
    .run();

  if (weightKg) {
    upsertBodyweight(user.id, weightKg);
  }

  revalidatePath("/");
  redirect("/onboarding/assess");
}

export async function saveSettingsAction(formData: FormData) {
  const user = await requireUser();
  const units = pickEnum(formData.get("units"), UNITS, "lb");
  // The form pre-fills weight/height in the units it was rendered with, which
  // may differ from the newly selected `units`. Parse with the render-time
  // units so flipping the dropdown doesn't silently corrupt stored values
  // (e.g. 180 lb re-read as 180 kg).
  const displayUnits = pickEnum(formData.get("displayUnits"), UNITS, units);
  const weightKg = displayWeightToKg(Number(formData.get("weight")), displayUnits);
  const heightCm = displayHeightToCm(Number(formData.get("height")), displayUnits);
  const programId = formString(formData, "programId");
  const existing = db.select().from(profiles).where(eq(profiles.userId, user.id)).get();
  const dietField = formData.get("dietId");
  const nextDietId =
    dietField === null ? existing?.activeDietId ?? null : String(dietField) || null;
  const dietChanged = nextDietId !== (existing?.activeDietId ?? null);
  const validDiet = nextDietId && getDiet(nextDietId) ? nextDietId : null;

  db.update(profiles)
    .set({
      sessionMinutes: clampInt(formData.get("sessionMinutes"), existing?.sessionMinutes ?? 60, 20, 180),
      daysPerWeek: clampInt(formData.get("daysPerWeek"), existing?.daysPerWeek ?? 4, 2, 7),
      injuries: JSON.stringify(listedInjuries(formData)),
      units,
      persona: pickEnum(formData.get("persona"), PERSONAS, (existing?.persona as Persona) || "scientist"),
      sex: pickEnum(formData.get("sex"), SEXES, (existing?.sex as (typeof SEXES)[number]) || "unspecified"),
      age: optionalAge(formData.get("age")) ?? existing?.age ?? null,
      heightCm: heightCm ?? existing?.heightCm ?? null,
      weightKg: weightKg ?? existing?.weightKg ?? null,
      experience: pickEnum(
        formData.get("experience"),
        EXPERIENCES,
        (existing?.experience as Experience) || "novice",
      ),
      goal: pickEnum(formData.get("goal"), GOALS, (existing?.goal as Goal) || "general"),
      activeProgramId: programId || existing?.activeProgramId,
      programStartDate:
        programId && programId !== existing?.activeProgramId ? todayISO() : existing?.programStartDate,
      currentWeek: programId && programId !== existing?.activeProgramId ? 1 : existing?.currentWeek ?? 1,
      activeDietId: validDiet,
      dietStartDate: dietChanged ? (validDiet ? todayISO() : null) : existing?.dietStartDate ?? null,
      dietWeek: dietChanged ? 1 : existing?.dietWeek ?? 1,
      equipment: listedEquipment(formData, ["bodyweight"]),
    })
    .where(eq(profiles.userId, user.id))
    .run();

  db.update(users)
    .set({ displayName: formString(formData, "displayName") || user.displayName })
    .where(eq(users.id, user.id))
    .run();

  await setPrefCookies(formString(formData, "aiOptIn") === "1", await getTheme(), undefined, user.id);

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
  const weightKg = displayWeightToKg(Number(formData.get("weight")), units);
  if (!weightKg) return;
  const date = todayISO();
  upsertBodyweight(user.id, weightKg, date);
  db.update(profiles).set({ weightKg }).where(eq(profiles.userId, user.id)).run();
  revalidatePath("/");
  revalidatePath("/nutrition");
  revalidatePath("/progress");
  const next = String(formData.get("next") || "/");
  if (next === "/progress") redirect("/progress?toast=weight");
  redirect("/?toast=weight");
}

export async function logCheckinAction(formData: FormData) {
  const user = await requireUser();
  const date = todayISO();
  const existing = db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.userId, user.id), eq(dailyCheckins.date, date)))
    .get();
  const sleepField = formData.get("sleepHours");
  const fatigueField = formData.get("fatigue");
  const payload = {
    sleepHours: optionalCheckinInt(sleepField, existing?.sleepHours ?? null, 0, 16),
    fatigue: optionalCheckinInt(fatigueField, existing?.fatigue ?? null, 1, 5),
    notes:
      formData.get("notes") == null
        ? (existing?.notes ?? null)
        : formString(formData, "notes").slice(0, 500) || null,
  };
  if (existing) {
    db.update(dailyCheckins)
      .set(payload)
      .where(and(eq(dailyCheckins.id, existing.id), eq(dailyCheckins.userId, user.id)))
      .run();
  } else {
    db.insert(dailyCheckins)
      .values({ id: crypto.randomUUID(), userId: user.id, date, ...payload })
      .run();
  }
  revalidatePath("/");
  redirect("/?toast=checkin");
}