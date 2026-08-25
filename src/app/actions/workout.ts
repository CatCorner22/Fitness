"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";
import { planAdjustFromAssessment } from "@/lib/assessment/plan-adjust";
import { upsertCalendarMark } from "@/lib/calendar";
import { CALENDAR_EPOCH, compareISO } from "@/lib/calendar-core";
import { db } from "@/lib/db";
import { setLogs, workouts } from "@/lib/db/schema";
import { lastWorkingSets, suggestionsForExercises } from "@/lib/autoregulation";
import { getProgram } from "@/lib/programs/catalog";
import { buildPlannedSession } from "@/lib/programs/plan";
import { clamp, clampInt, todayISO } from "@/lib/utils";
import { parseRepTarget } from "@/lib/copy";
import { allowedSubstitutes, getExercise } from "@/lib/exercises/registry";

async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function startWorkoutAction(dayId?: string) {
  const user = await requireUser();
  const profile = getProfile(user.id);
  if (!profile?.activeProgramId) redirect("/programs");

  const fitness = planAdjustFromAssessment(profile.assessment);
  const draft = buildPlannedSession({
    programId: profile.activeProgramId,
    week: profile.currentWeek,
    dayId,
    sessionMinutes: profile.sessionMinutes,
    injuries: profile.injuries,
    equipment: profile.equipment,
    fitness,
  });
  if (!draft) redirect("/programs");
  const last = lastWorkingSets(
    user.id,
    draft.exercises.map((e) => e.exerciseId),
  );
  const { suggested } = suggestionsForExercises(
    user.id,
    draft.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      targetRpe: e.targetRpe,
      reps: e.reps,
    })),
    last,
  );
  const planned = buildPlannedSession({
    programId: profile.activeProgramId,
    week: profile.currentWeek,
    dayId: draft.day.id,
    sessionMinutes: profile.sessionMinutes,
    injuries: profile.injuries,
    equipment: profile.equipment,
    lastSets: last,
    suggested,
    fitness,
  });
  if (!planned) redirect("/programs");

  const id = crypto.randomUUID();
  let resumeId: string | null = null;
  db.transaction((tx) => {
    const open = tx
      .select()
      .from(workouts)
      .where(and(eq(workouts.userId, user.id), eq(workouts.status, "in_progress")))
      .get();
    if (open) {
      resumeId = open.id;
      return;
    }

    tx.insert(workouts)
      .values({
        id,
        userId: user.id,
        programId: planned.program.id,
        dayId: planned.day.id,
        dayName: planned.day.name,
        week: planned.week,
        date: todayISO(),
        startedAt: new Date().toISOString(),
        status: "in_progress",
      })
      .run();

    for (const item of planned.exercises) {
      for (let i = 0; i < item.sets; i++) {
        tx.insert(setLogs)
          .values({
            id: crypto.randomUUID(),
            workoutId: id,
            userId: user.id,
            exerciseId: item.exerciseId,
            setIndex: i,
            targetReps: item.reps,
            targetRpe: item.targetRpe,
            weightKg: item.suggestedWeightKg,
            reps: last[item.exerciseId]?.reps ?? parseRepTarget(item.reps),
            rpe: null,
            completed: 0,
          })
          .run();
      }
    }
  });

  if (resumeId) redirect(`/workout/${resumeId}`);
  revalidatePath("/");
  redirect(`/workout/${id}`);
}

export async function logSetAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("setId") || "");
  const weight = Number(formData.get("weight"));
  const reps = Number(formData.get("reps"));
  const rpe = Number(formData.get("rpe"));
  const profile = getProfile(user.id);
  const units = profile?.units ?? "lb";
  const weightKg = Number.isFinite(weight) ? (units === "lb" ? clamp(weight, 0, 1000) / 2.20462 : clamp(weight, 0, 1000)) : null;

  db.update(setLogs)
    .set({
      weightKg,
      reps: Number.isFinite(reps) ? Math.round(clamp(reps, 0, 100)) : null,
      rpe: Number.isFinite(rpe) ? clamp(rpe, 1, 10) : null,
      completed: 1,
    })
    .where(and(eq(setLogs.id, id), eq(setLogs.userId, user.id)))
    .run();

  const set = db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.id, id), eq(setLogs.userId, user.id)))
    .get();
  revalidatePath(`/workout/${set?.workoutId}`);
}

export async function swapExerciseAction(formData: FormData) {
  const user = await requireUser();
  const profile = getProfile(user.id);
  const workoutId = String(formData.get("workoutId") || "");
  const fromId = String(formData.get("fromId") || "");
  const toId = String(formData.get("toId") || "");
  const exercise = getExercise(toId);
  if (!exercise || exercise.safety === "banned") return;
  const allowed = allowedSubstitutes(fromId, profile?.injuries ?? []).some((alt) => alt.id === toId);
  if (!allowed) return;

  db.transaction((tx) => {
    const owned = tx
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)))
      .get();
    if (!owned) return;
    const rows = tx
      .select()
      .from(setLogs)
      .where(and(eq(setLogs.workoutId, workoutId), eq(setLogs.userId, user.id), eq(setLogs.exerciseId, fromId)))
      .all();
    for (const row of rows) {
      tx.update(setLogs).set({ exerciseId: toId, completed: 0 }).where(eq(setLogs.id, row.id)).run();
    }
  });
  revalidatePath(`/workout/${workoutId}`);
}

export async function completeWorkoutAction(formData: FormData) {
  const user = await requireUser();
  const workoutId = String(formData.get("workoutId") || "");
  const existing = db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)))
    .get();
  if (!existing) redirect("/");
  const sessionRaw = String(formData.get("sessionRpe") || "");
  const sessionRpe = sessionRaw === "" ? Number.NaN : Number(sessionRaw);
  const durationMinutes = Number(formData.get("durationMinutes"));
  const stopped = String(formData.get("stop") || "") === "1";
  const notes = stopped
    ? "Stopped early — something hurt."
    : String(formData.get("notes") || "");

  db.update(workouts)
    .set({
      status: "completed",
      completedAt: new Date().toISOString(),
      sessionRpe: Number.isFinite(sessionRpe) ? sessionRpe : null,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      notes,
    })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)))
    .run();

  if (compareISO(existing.date, CALENDAR_EPOCH) >= 0) {
    upsertCalendarMark(user.id, existing.date, "did");
  }

  revalidatePath("/");
  revalidatePath("/progress");
  if (stopped) redirect("/?toast=saved");
  redirect(`/workout/${workoutId}/complete`);
}

export async function skipWorkoutAction(dayId: string, _dayName: string, programId: string, week: number) {
  const user = await requireUser();
  const program = getProgram(programId);
  const day = program?.days.find((d) => d.id === dayId);
  if (!program || !day) return;
  const date = todayISO();
  db.insert(workouts)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      programId: program.id,
      dayId: day.id,
      dayName: day.name,
      week: clampInt(week, 1, 1, program.durationWeeks),
      date,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "skipped",
    })
    .run();
  if (compareISO(date, CALENDAR_EPOCH) >= 0) {
    upsertCalendarMark(user.id, date, "skipped");
  }
  revalidatePath("/");
  revalidatePath("/progress");
  redirect("/?toast=skipped");
}
