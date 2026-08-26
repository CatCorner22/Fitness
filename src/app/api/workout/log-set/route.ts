import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getProfile, getSession } from "@/lib/auth";
import { generateLiveAdvice } from "@/lib/ai/live-advice";
import { allowedSubstitutes } from "@/lib/exercises/registry";
import { db } from "@/lib/db";
import { dailyCheckins, setLogs, workouts } from "@/lib/db/schema";
import { displayToKg, todayISO, clamp } from "@/lib/utils";
import { getExercise } from "@/lib/exercises/registry";
import { getAiOptIn } from "@/lib/prefs";

function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("coach timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = getProfile(user.id);
  if (!profile) return NextResponse.json({ error: "Profile missing" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const setId = String(body.setId ?? "");
  const weight = Number(body.weight);
  const reps = Number(body.reps);
  const rpe = body.rpe == null || body.rpe === "" ? Number.NaN : Number(body.rpe);
  const elapsedMinutes = Number(body.elapsedMinutes) || 0;
  const remainingExercises = Number(body.remainingExercises) || 0;

  const row = db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.id, setId), eq(setLogs.userId, user.id)))
    .get();
  if (!row) return NextResponse.json({ error: "Set not found" }, { status: 404 });

  const weightKg = Number.isFinite(weight) ? displayToKg(clamp(weight, 0, 1000), profile.units) : null;

  try {
    db.update(setLogs)
      .set({
        weightKg,
        reps: Number.isFinite(reps) ? Math.round(clamp(reps, 0, 100)) : null,
        rpe: Number.isFinite(rpe) ? clamp(rpe, 1, 10) : null,
        completed: 1,
      })
      .where(and(eq(setLogs.id, setId), eq(setLogs.userId, user.id)))
      .run();
  } catch {
    return NextResponse.json({ error: "Could not save set" }, { status: 500 });
  }

  const catalogRest = getExercise(row.exerciseId)?.restSeconds ?? 90;
  const silentAdvice = {
    message: "",
    restSeconds: catalogRest,
    nextAction: "repeat_load" as const,
    weightDeltaKg: null,
    swapToExerciseId: null,
    mood: "encouraging" as const,
    citeIds: [] as string[],
    source: "rules" as const,
  };

  try {
    const workout = db.select().from(workouts).where(eq(workouts.id, row.workoutId)).get();
    const exercise = getExercise(row.exerciseId);
    const allSets = db.select().from(setLogs).where(eq(setLogs.workoutId, row.workoutId)).all();
    const exerciseSets = allSets.filter((s) => s.exerciseId === row.exerciseId);
    const priorSets = exerciseSets
      .filter((s) => s.setIndex < row.setIndex && s.completed)
      .map((s) => ({
        setIndex: s.setIndex,
        weightKg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe,
      }));
    const exerciseGroups = [...new Set(allSets.map((s) => s.exerciseId))];
    const currentIdx = exerciseGroups.indexOf(row.exerciseId);
    const remaining =
      remainingExercises || Math.max(0, exerciseGroups.length - currentIdx - 1);

    if (!(await getAiOptIn())) {
      return NextResponse.json({ advice: silentAdvice, workoutDay: workout?.dayName });
    }

    const checkin = db
      .select()
      .from(dailyCheckins)
      .where(and(eq(dailyCheckins.userId, user.id), eq(dailyCheckins.date, todayISO())))
      .get();

    const swaps = allowedSubstitutes(row.exerciseId, profile.injuries).map((s) => s.id);

    const advice = await withTimeout(
      generateLiveAdvice({
        profile,
        workoutId: row.workoutId,
        exerciseId: row.exerciseId,
        exerciseName: exercise?.name ?? row.exerciseId,
        setIndex: row.setIndex,
        totalSets: exerciseSets.length,
        targetReps: row.targetReps ?? "8",
        targetRpe: row.targetRpe ?? 8,
        weightKg,
        reps: Number.isFinite(reps) ? reps : null,
        rpe: Number.isFinite(rpe) ? rpe : null,
        allowedSwapIds: swaps,
        sessionMinutesBudget: profile.sessionMinutes,
        elapsedMinutes,
        remainingExercises: remaining,
        priorSets,
        fatigue: checkin?.fatigue ?? null,
      }),
      8000,
    );

    return NextResponse.json({ advice, workoutDay: workout?.dayName });
  } catch {
    return NextResponse.json({ advice: silentAdvice });
  }
}
