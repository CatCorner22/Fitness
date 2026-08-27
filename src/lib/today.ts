import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyCheckins, nutritionLogs, workouts } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import { planAdjustForSession } from "@/lib/assessment/session-adjust";
import type { FitnessPlanAdjust } from "@/lib/assessment/types";
import { shouldDeload } from "@/lib/autoregulation";
import { getProgram } from "@/lib/programs/catalog";
import { buildPlannedSession } from "@/lib/programs/plan";
import { daysAgoISO, todayISO } from "@/lib/utils";

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return todayISO(d);
}

export function todaysPlan(userId: string, profile: ProfileRow, fitness?: FitnessPlanAdjust) {
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
    fitness: fitness ?? planAdjustForSession(userId, profile.assessment),
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

function todayCheckin(userId: string) {
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

export function weekDayStatuses(plan: NonNullable<ReturnType<typeof todaysPlan>>) {
  const nextId = plan.planned?.day.id;
  return plan.program.days.map((day) => {
    const logged = plan.weekWorkouts.find((w) => w.dayId === day.id);
    const status =
      logged?.status === "completed"
        ? "done"
        : logged?.status === "skipped"
          ? "skipped"
          : logged?.status === "in_progress"
            ? "open"
            : nextId === day.id
              ? "today"
              : "upcoming";
    return { id: day.id, name: day.name, status } as const;
  });
}

/** One pass for Today: check-in, deload, plan, food, 14-day completed count. */
export function getTodaySnapshot(userId: string, profile: ProfileRow) {
  const checkin = todayCheckin(userId);
  const deload = shouldDeload(userId);
  const fitness = planAdjustForSession(userId, profile.assessment, {
    energy: checkin?.fatigue ?? null,
    deload,
  });
  const plan = todaysPlan(userId, profile, fitness);
  const food = todayNutrition(userId);
  const completed14d = db
    .select({ id: workouts.id })
    .from(workouts)
    .where(
      and(eq(workouts.userId, userId), eq(workouts.status, "completed"), gte(workouts.date, daysAgoISO(14))),
    )
    .all().length;

  return { plan, checkin, deload, food, completed14d };
}
