import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { nutritionLogs, workouts } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import { lastWorkingSets, suggestionsForExercises, weeklyVolume } from "@/lib/autoregulation";
import { getProgram } from "@/lib/programs/catalog";
import { buildPlannedSession } from "@/lib/programs/plan";
import { todayISO } from "@/lib/utils";

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return todayISO(d);
}

export function todaysPlan(userId: string, profile: ProfileRow) {
  if (!profile.activeProgramId) return null;
  const program = getProgram(profile.activeProgramId);
  if (!program) return null;

  const weekStart = startOfWeekISO();
  const weekWorkouts = db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.programId, program.id)))
    .all()
    .filter((w) => w.date >= weekStart && w.week === profile.currentWeek);

  const doneIds = weekWorkouts.filter((w) => w.status !== "in_progress").map((w) => w.dayId);
  const nextDay = program.days.find((d) => !doneIds.includes(d.id)) ?? program.days[0];
  const allDone = program.days.every((d) => doneIds.includes(d.id));

  const last = lastWorkingSets(userId);
  const draft = buildPlannedSession({
    programId: program.id,
    week: profile.currentWeek,
    dayId: nextDay.id,
    sessionMinutes: profile.sessionMinutes,
    injuries: profile.injuries,
    equipment: profile.equipment,
    lastSets: last,
  });
  if (!draft) return null;
  const { suggested, decisions } = suggestionsForExercises(
    userId,
    draft.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      targetRpe: e.targetRpe,
      reps: e.reps,
    })),
  );
  const planned = buildPlannedSession({
    programId: program.id,
    week: profile.currentWeek,
    dayId: nextDay.id,
    sessionMinutes: profile.sessionMinutes,
    injuries: profile.injuries,
    equipment: profile.equipment,
    lastSets: last,
    suggested,
  });

  const open = db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.status, "in_progress")))
    .get();

  return {
    program,
    planned,
    decisions,
    allDone,
    weekWorkouts,
    open,
    volume: weeklyVolume(userId, weekStart),
  };
}

export function todayNutrition(userId: string) {
  const date = todayISO();
  const logs = db
    .select()
    .from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, date)))
    .all();
  return {
    logs,
    calories: logs.reduce((s, l) => s + l.calories, 0),
    protein: logs.reduce((s, l) => s + l.protein, 0),
    carbs: logs.reduce((s, l) => s + l.carbs, 0),
    fat: logs.reduce((s, l) => s + l.fat, 0),
  };
}