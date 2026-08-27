import { and, eq, gte, lte } from "drizzle-orm";
import {
  addDaysISO,
  CALENDAR_EPOCH,
  compareISO,
  resolveFill,
  type CalendarFill,
  type CalendarMarkFill,
} from "@/lib/calendar-core";
import { db, ensureMigrated } from "@/lib/db";
import { calendarMarks, workouts } from "@/lib/db/schema";
import { todayISO } from "@/lib/utils";

export { addDaysISO, CALENDAR_EPOCH };

export function loadCalendarState(userId: string, today = todayISO()) {
  ensureMigrated();
  const completed = db
    .select({ date: workouts.date })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.status, "completed")))
    .all();
  const completedDates = new Set(completed.map((row) => row.date));

  const markRows = db
    .select()
    .from(calendarMarks)
    .where(and(eq(calendarMarks.userId, userId), gte(calendarMarks.date, CALENDAR_EPOCH), lte(calendarMarks.date, today)))
    .all();
  const marks: Record<string, CalendarMarkFill> = {};
  for (const row of markRows) {
    if (row.fill === "did" || row.fill === "skipped") marks[row.date] = row.fill;
  }

  return { today, completedDates, marks };
}

export function fillMapRange(fromISO: string, toISO: string, state: ReturnType<typeof loadCalendarState>) {
  const fills: Record<string, CalendarFill> = {};
  let date = fromISO;
  while (compareISO(date, toISO) <= 0) {
    fills[date] = resolveFill({ date, ...state });
    date = addDaysISO(date, 1);
  }
  return fills;
}

export function upsertCalendarMark(userId: string, date: string, fill: CalendarMarkFill) {
  const now = new Date().toISOString();
  const existing = db
    .select()
    .from(calendarMarks)
    .where(and(eq(calendarMarks.userId, userId), eq(calendarMarks.date, date)))
    .get();
  if (existing) {
    db.update(calendarMarks)
      .set({ fill, updatedAt: now })
      .where(eq(calendarMarks.id, existing.id))
      .run();
    return;
  }
  db.insert(calendarMarks)
    .values({
      id: crypto.randomUUID(),
      userId,
      date,
      fill,
      updatedAt: now,
    })
    .run();
}
