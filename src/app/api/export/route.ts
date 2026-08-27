import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyweightLogs, calendarMarks, fasts, nutritionLogs, setLogs, workouts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return new Response("Login required", { status: 401 });
  }

  const sessionRows = db.select().from(workouts).where(eq(workouts.userId, user.id)).all();
  const sets = db.select().from(setLogs).where(and(eq(setLogs.userId, user.id), eq(setLogs.completed, 1))).all();
  const foods = db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, user.id)).all();
  const weights = db.select().from(bodyweightLogs).where(eq(bodyweightLogs.userId, user.id)).all();
  const fastRows = db.select().from(fasts).where(eq(fasts.userId, user.id)).all();
  const marks = db.select().from(calendarMarks).where(eq(calendarMarks.userId, user.id)).all();

  // Every row template below must produce exactly one value per header column.
  const header = [
    "type",
    "date",
    "workout",
    "exercise",
    "set",
    "weight_kg",
    "reps",
    "rpe",
    "session_rpe",
    "calories",
    "protein",
    "status",
    "minutes",
    "notes",
  ] as const;
  type Row = Partial<Record<(typeof header)[number], string | number | null>>;
  const row = (values: Row) =>
    header
      .map((column) => {
        const value = values[column];
        if (value === null || value === undefined) return "";
        return typeof value === "number" ? String(value) : csv(value);
      })
      .join(",");

  const workoutById = new Map(sessionRows.map((w) => [w.id, w]));
  const lines = [
    header.join(","),
    ...sessionRows.map((w) =>
      row({
        type: "workout",
        date: w.date,
        workout: w.dayName,
        session_rpe: w.sessionRpe,
        status: w.status,
        minutes: w.durationMinutes,
        notes: w.notes,
      }),
    ),
    ...sets.map((s) => {
      const w = workoutById.get(s.workoutId);
      return row({
        type: "set",
        date: w?.date,
        workout: w?.dayName,
        exercise: s.exerciseId,
        set: s.setIndex + 1,
        weight_kg: s.weightKg,
        reps: s.reps,
        rpe: s.rpe,
        notes: s.notes,
      });
    }),
    ...foods.map((f) =>
      row({
        type: "food",
        date: f.date,
        exercise: f.foodName,
        calories: f.calories,
        protein: f.protein,
      }),
    ),
    ...weights.map((w) => row({ type: "weight", date: w.date, weight_kg: w.weightKg })),
    ...fastRows.map((f) =>
      row({
        type: "fast",
        date: f.startedAt.slice(0, 10),
        workout: f.protocol,
        status: f.status,
        minutes: f.targetMinutes,
        notes: f.notes,
      }),
    ),
    ...marks.map((m) => row({ type: "calendar", date: m.date, status: m.fill })),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="garanimal-${user.username}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function csv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}