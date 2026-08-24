import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyweightLogs, nutritionLogs, setLogs, workouts } from "@/lib/db/schema";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return new Response("Login required", { status: 401 });
  }

  const sessionRows = db.select().from(workouts).where(eq(workouts.userId, user.id)).all();
  const sets = db.select().from(setLogs).where(and(eq(setLogs.userId, user.id), eq(setLogs.completed, 1))).all();
  const foods = db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, user.id)).all();
  const weights = db.select().from(bodyweightLogs).where(eq(bodyweightLogs.userId, user.id)).all();

  const lines = [
    "type,date,workout,exercise,set,weight_kg,reps,rpe,session_rpe,calories,protein,notes",
    ...sessionRows.map(
      (w) =>
        `workout,${w.date},${csv(w.dayName)},,,"","","",${w.sessionRpe ?? ""},,,${csv(w.notes ?? "")}`,
    ),
    ...sets.map(
      (s) => {
        const w = sessionRows.find((row) => row.id === s.workoutId);
        return `set,${w?.date ?? ""},${csv(w?.dayName ?? "")},${csv(s.exerciseId)},${s.setIndex + 1},${s.weightKg ?? ""},${s.reps ?? ""},${s.rpe ?? ""},,,,`;
      },
    ),
    ...foods.map(
      (f) => `food,${f.date},,${csv(f.foodName)},,,,,${f.calories},${f.protein},`,
    ),
    ...weights.map((w) => `weight,${w.date},,,,,,${w.weightKg},,,,`),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="garanimal-${user.username}.csv"`,
    },
  });
}

function csv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}