import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyCheckins, nutritionLogs, workouts } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import { planAdjustForSession } from "@/lib/assessment/session-adjust";
import type { FitnessPlanAdjust } from "@/lib/assessment/types";
import { shouldDeload } from "@/lib/autoregulation";
import { getProgram } from "@/lib/programs/catalog";
import { buildPlannedSession } from "@/lib/programs/plan";
import { scheduledProgramDays } from "@/lib/programs/schedule";
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

  const since = profile.programStartDate ?? startOfWeekISO();
  const weekWorkouts = db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workouts.programId, program.id),
        eq(workouts.week, profile.currentWeek),
        gte(workouts.date, since),
      ),
    )
    .all();

  const scheduledDays = scheduledProgramDays(program.days, profile.daysPerWeek);
  if (!scheduledDays.length) return null;
  const doneIds = new Set(weekWorkouts.filter((w) => w.status !== "in_progress").map((w) => w.dayId));
  const nextDay = scheduledDays.find((d) => !doneIds.has(d.id)) ?? scheduledDays[0];
  if (!nextDay) return null;
  const allDone = scheduledDays.every((d) => doneIds.has(d.id));

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
    scheduledDays,
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
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const log of logs) {
    totals.calories += log.calories;
    totals.protein += log.protein;
    totals.carbs += log.carbs;
    totals.fat += log.fat;
  }
  return { logs, ...totals };
}

export function weekDayStatuses(plan: NonNullable<ReturnType<typeof todaysPlan>>) {
  const nextId = plan.planned?.day.id;
  return plan.scheduledDays.map((day) => {
    const rows = plan.weekWorkouts.filter((w) => w.dayId === day.id);
    const fromLog = rows.some((w) => w.status === "completed")
      ? "done"
      : rows.some((w) => w.status === "skipped")
        ? "skipped"
        : rows.some((w) => w.status === "in_progress")
          ? "open"
          : undefined;
    const status = fromLog ?? (nextId === day.id ? "today" : "upcoming");
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
