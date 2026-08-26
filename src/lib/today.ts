import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyCheckins, nutritionLogs, workouts } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import { planAdjustForSession } from "@/lib/assessment/session-adjust";
import { getProgram } from "@/lib/programs/catalog";
import { buildPlannedSession } from "@/lib/programs/plan";
import { todayISO } from "@/lib/utils";

export { yesterdayISO } from "@/lib/utils";

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
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workouts.programId, program.id),
        eq(workouts.week, profile.currentWeek),
        gte(workouts.date, weekStart),
      ),
    )
    .all();

  const doneIds = weekWorkouts.filter((w) => w.status !== "in_progress").map((w) => w.dayId);
  const nextDay = program.days.find((d) => !doneIds.includes(d.id)) ?? program.days[0];
  const allDone = program.days.every((d) => doneIds.includes(d.id));

  const planned = buildPlannedSession({
    programId: program.id,
    week: profile.currentWeek,
    dayId: nextDay.id,
    sessionMinutes: profile.sessionMinutes,
    injuries: profile.injuries,
    equipment: profile.equipment,
    fitness: planAdjustForSession(userId, profile.assessment),
  });

  const open = db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.status, "in_progress")))
    .get();

  return {
    program,
    planned,
    allDone,
    weekWorkouts,
    open,
  };
}

export function todayCheckin(userId: string) {
  return db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.date, todayISO())))
    .get();
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
