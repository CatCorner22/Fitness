import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { setLogs, workouts } from "@/lib/db/schema";
import { getExercise } from "@/lib/exercises/registry";
import { epley1RM } from "@/lib/utils";
import type { Muscle } from "@/lib/types";

export type LoadDecision = {
  exerciseId: string;
  nextWeightKg: number | null;
  reason: string;
  lastWeightKg: number | null;
  lastRpe: number | null;
  lastReps: number | null;
  targetRpe: number | null;
};

function incrementKg(exerciseId: string) {
  const ex = getExercise(exerciseId);
  if (ex?.pattern === "isolation") return 1.25;
  if (ex?.pattern === "mobility") return 2.5;
  if (ex?.pattern.includes("push") || ex?.pattern.includes("pull")) return 2.5;
  return 5;
}

export function suggestNextLoad(input: {
  lastWeightKg: number | null;
  lastRpe: number | null;
  lastReps: number | null;
  targetRpe: number;
  targetReps: string;
  missed?: boolean;
  exerciseId?: string;
}): { weightKg: number | null; reason: string } {
  const { lastWeightKg, lastRpe, targetRpe, exerciseId = "back-squat" } = input;
  if (lastWeightKg == null) {
    return { weightKg: null, reason: "No history yet — pick a load that leaves 2–3 reps in reserve on the first working set." };
  }
  if (input.missed || (lastRpe != null && lastRpe >= targetRpe + 1)) {
    const drop = Math.round(lastWeightKg * 0.05 * 2) / 2;
    return {
      weightKg: Math.max(0, lastWeightKg - Math.max(drop, 2.5)),
      reason: `Last top set overshot the target (RPE ${lastRpe ?? "miss"} vs ${targetRpe}). Hold or drop ~5% and own the reps.`,
    };
  }
  if (lastRpe != null && lastRpe <= targetRpe - 1) {
    return {
      weightKg: lastWeightKg + incrementKg(exerciseId),
      reason: `Last top set was ≥1 RPE under target (${lastRpe} vs ${targetRpe}). Add a small jump.`,
    };
  }
  return {
    weightKg: lastWeightKg,
    reason: `Last top set matched the target window (RPE ${lastRpe ?? "—"}). Repeat the load and chase clean reps.`,
  };
}

export function lastWorkingSets(userId: string, exerciseIds?: string[]) {
  const map: Record<string, { weightKg: number; reps: number; rpe: number | null }> = {};
  const ids = exerciseIds?.length ? [...new Set(exerciseIds)] : null;
  const rows = db
    .select({
      exerciseId: setLogs.exerciseId,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
      rpe: setLogs.rpe,
    })
    .from(setLogs)
    .innerJoin(workouts, eq(setLogs.workoutId, workouts.id))
    .where(
      and(
        eq(setLogs.userId, userId),
        eq(setLogs.completed, 1),
        eq(workouts.status, "completed"),
        ids ? inArray(setLogs.exerciseId, ids) : undefined,
      ),
    )
    .orderBy(desc(workouts.startedAt), desc(setLogs.setIndex))
    .all();

  for (const row of rows) {
    if (map[row.exerciseId] || row.weightKg == null || row.reps == null) continue;
    map[row.exerciseId] = { weightKg: row.weightKg, reps: row.reps, rpe: row.rpe };
    if (ids && Object.keys(map).length === ids.length) break;
  }
  return map;
}

export function suggestionsForExercises(
  userId: string,
  items: { exerciseId: string; targetRpe: number; reps: string }[],
  last = lastWorkingSets(userId),
) {
  const suggested: Record<string, number | null> = {};
  const decisions: LoadDecision[] = [];
  for (const item of items) {
    const prev = last[item.exerciseId];
    const decision = suggestNextLoad({
      lastWeightKg: prev?.weightKg ?? null,
      lastRpe: prev?.rpe ?? null,
      lastReps: prev?.reps ?? null,
      targetRpe: item.targetRpe,
      targetReps: item.reps,
      exerciseId: item.exerciseId,
    });
    suggested[item.exerciseId] = decision.weightKg;
    decisions.push({
      exerciseId: item.exerciseId,
      nextWeightKg: decision.weightKg,
      reason: decision.reason,
      lastWeightKg: prev?.weightKg ?? null,
      lastRpe: prev?.rpe ?? null,
      lastReps: prev?.reps ?? null,
      targetRpe: item.targetRpe,
    });
  }
  return { suggested, decisions, last };
}

export const VOLUME_LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  glutes: { mev: 6, mav: 12, mrv: 22 },
  quads: { mev: 6, mav: 12, mrv: 20 },
  hamstrings: { mev: 4, mav: 8, mrv: 16 },
  chest: { mev: 6, mav: 12, mrv: 20 },
  lats: { mev: 6, mav: 12, mrv: 20 },
  upper_back: { mev: 6, mav: 12, mrv: 20 },
  front_delts: { mev: 4, mav: 8, mrv: 14 },
  side_delts: { mev: 6, mav: 12, mrv: 20 },
  rear_delts: { mev: 4, mav: 8, mrv: 16 },
  triceps: { mev: 4, mav: 8, mrv: 16 },
  biceps: { mev: 4, mav: 8, mrv: 16 },
  abs: { mev: 0, mav: 6, mrv: 12 },
};

export function weeklyVolume(userId: string, sinceISO: string) {
  const completed = db
    .select({ id: workouts.id })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.status, "completed"), gte(workouts.date, sinceISO)))
    .all();
  if (!completed.length) return {} as Partial<Record<Muscle, number>>;

  const ids = completed.map((w) => w.id);
  const sets = db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.userId, userId), eq(setLogs.completed, 1), inArray(setLogs.workoutId, ids)))
    .all();
  const totals: Partial<Record<Muscle, number>> = {};

  for (const set of sets) {
    const ex = getExercise(set.exerciseId);
    if (!ex || ex.isCardio || ex.pattern === "mobility") continue;
    for (const muscle of ex.primaryMuscles) {
      totals[muscle] = (totals[muscle] ?? 0) + 1;
    }
    for (const muscle of ex.secondaryMuscles) {
      totals[muscle] = (totals[muscle] ?? 0) + 0.5;
    }
  }
  return totals;
}

export function shouldDeload(userId: string) {
  const recent = db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.status, "completed")))
    .orderBy(desc(workouts.startedAt))
    .limit(6)
    .all();

  if (recent.length < 4) return { deload: false, reason: "Not enough recent sessions to judge fatigue." };
  const rpes = recent.map((w) => w.sessionRpe).filter((n): n is number => n != null);
  const avg = rpes.reduce((a, b) => a + b, 0) / Math.max(1, rpes.length);
  const high = rpes.filter((r) => r >= 8.5).length;
  if (avg >= 8.2 && high >= 3) {
    return {
      deload: true,
      reason: `Rolling session RPE is ${avg.toFixed(1)} with ${high} very hard days. Cut volume ~40% this week.`,
    };
  }
  return { deload: false, reason: `Rolling session RPE is ${avg ? avg.toFixed(1) : "—"}. Stay the course.` };
}

export function bestSets(userId: string) {
  const sets = db
    .select({
      exerciseId: setLogs.exerciseId,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
    })
    .from(setLogs)
    .where(and(eq(setLogs.userId, userId), eq(setLogs.completed, 1)))
    .all();
  const best: Record<string, { weightKg: number; reps: number; e1rm: number; date?: string }> = {};
  for (const set of sets) {
    if (set.weightKg == null || set.reps == null || set.reps <= 0) continue;
    const e1rm = epley1RM(set.weightKg, set.reps);
    if (!best[set.exerciseId] || e1rm > best[set.exerciseId].e1rm) {
      best[set.exerciseId] = { weightKg: set.weightKg, reps: set.reps, e1rm };
    }
  }
  return best;
}