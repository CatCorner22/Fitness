import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { WorkoutPlayer } from "@/components/workout-player";
import { allowedSubstitutes, getExercise } from "@/lib/exercises/registry";
import { db } from "@/lib/db";
import { setLogs, workouts } from "@/lib/db/schema";
import { estimateSessionMinutes } from "@/lib/programs/plan";
import { planAdjustForSession } from "@/lib/assessment/session-adjust";
import { requireAuthed } from "@/lib/session-page";
import { courseForProgram } from "@/lib/course/catalog";
import { lastWorkingSets, suggestionsForExercises } from "@/lib/autoregulation";
import { getAiOptIn } from "@/lib/prefs";
import { aiEnabled } from "@/lib/spirit/config";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireAuthed();
  const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!workout || workout.userId !== user.id) notFound();

  const sets = db.select().from(setLogs).where(eq(setLogs.workoutId, id)).all();
  const grouped = new Map<string, typeof sets>();
  for (const row of sets) {
    const list = grouped.get(row.exerciseId) ?? [];
    list.push(row);
    grouped.set(row.exerciseId, list);
  }
  const exerciseIds = [...grouped.keys()];
  const exercises = Object.fromEntries(
    exerciseIds.map((eid) => [eid, getExercise(eid)]).filter(([, ex]) => ex),
  ) as Record<string, NonNullable<ReturnType<typeof getExercise>>>;
  const templateExercises = exerciseIds.map((eid) => {
    const rows = grouped.get(eid) ?? [];
    return {
      exerciseId: eid,
      sets: rows.length,
      reps: rows[0]?.targetReps ?? "8",
      targetRpe: rows[0]?.targetRpe ?? 8,
      priority: 2 as const,
    };
  });

  const swaps = Object.fromEntries(
    exerciseIds.map((eid) => [eid, allowedSubstitutes(eid, profile.injuries)]),
  );

  const ghostSets = lastWorkingSets(user.id, exerciseIds);
  const sessionAdjust = planAdjustForSession(user.id, profile.assessment);
  const course = courseForProgram(workout.programId);
  const optIn = await getAiOptIn();
  const { decisions } = suggestionsForExercises(
    user.id,
    templateExercises.map(({ exerciseId, targetRpe, reps }) => ({ exerciseId, targetRpe, reps })),
    ghostSets,
  );

  return (
    <AppShell user={user} profile={profile}>
      <WorkoutPlayer
        workoutId={workout.id}
        dayName={workout.dayName}
        units={profile.units}
        sets={sets}
        exercises={exercises}
        swaps={swaps}
        estimatedMinutes={estimateSessionMinutes(templateExercises)}
        decisions={decisions.map((d) => ({ exerciseId: d.exerciseId, reason: d.reason }))}
        aiAvailable={optIn && aiEnabled()}
        aiOptIn={optIn}
        ghostSets={ghostSets}
        restMultiplier={sessionAdjust.restMultiplier}
        courseId={course?.id}
        courseSkillIds={course?.modules.flatMap((m) => m.skillIds)}
      />
    </AppShell>
  );
}
