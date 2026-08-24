import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { setLogs } from "@/lib/db/schema";
import { getExercise } from "@/lib/exercises/registry";
import { epley1RM } from "@/lib/utils";

export type WorkoutPR = {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  e1rm: number;
  previousE1rm: number | null;
};

export function detectWorkoutPRs(userId: string, workoutId: string): WorkoutPR[] {
  const allSets = db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.userId, userId), eq(setLogs.completed, 1)))
    .all();

  const historicalBest: Record<string, number> = {};
  for (const set of allSets) {
    if (set.workoutId === workoutId) continue;
    if (set.weightKg == null || set.reps == null || set.reps <= 0) continue;
    const e1rm = epley1RM(set.weightKg, set.reps);
    historicalBest[set.exerciseId] = Math.max(historicalBest[set.exerciseId] ?? 0, e1rm);
  }

  const workoutBest: Record<string, { weightKg: number; reps: number; e1rm: number }> = {};
  for (const set of allSets) {
    if (set.workoutId !== workoutId) continue;
    if (set.weightKg == null || set.reps == null || set.reps <= 0) continue;
    const e1rm = epley1RM(set.weightKg, set.reps);
    const prev = workoutBest[set.exerciseId];
    if (!prev || e1rm > prev.e1rm) {
      workoutBest[set.exerciseId] = { weightKg: set.weightKg, reps: set.reps, e1rm };
    }
  }

  const prs: WorkoutPR[] = [];
  for (const [exerciseId, top] of Object.entries(workoutBest)) {
    const previous = historicalBest[exerciseId] ?? null;
    if (previous == null || top.e1rm > previous + 0.25) {
      prs.push({
        exerciseId,
        exerciseName: getExercise(exerciseId)?.name ?? exerciseId,
        weightKg: top.weightKg,
        reps: top.reps,
        e1rm: top.e1rm,
        previousE1rm: previous,
      });
    }
  }
  return prs.sort((a, b) => b.e1rm - a.e1rm);
}

export function workoutSetStats(workoutId: string) {
  const sets = db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.workoutId, workoutId), eq(setLogs.completed, 1)))
    .all();
  const exercises = new Set(sets.map((s) => s.exerciseId));
  const volume = sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
  return {
    totalSets: sets.length,
    exercises: exercises.size,
    volumeKg: Math.round(volume),
  };
}
