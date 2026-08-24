import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { WorkoutPlayer } from "@/components/workout-player";
import { allowedSubstitutes, getExercise } from "@/lib/exercises/registry";
import { db } from "@/lib/db";
import { setLogs, workouts } from "@/lib/db/schema";
import { getProgram } from "@/lib/programs/catalog";
import { estimateSessionMinutes } from "@/lib/programs/plan";
import { requireAuthed } from "@/lib/session-page";
import { suggestionsForExercises } from "@/lib/autoregulation";
import { aiEnabled } from "@/lib/ai/spirit";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireAuthed();
  const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!workout || workout.userId !== user.id) notFound();

  const sets = db.select().from(setLogs).where(eq(setLogs.workoutId, id)).all();
  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exercises = Object.fromEntries(
    exerciseIds.map((eid) => [eid, getExercise(eid)]).filter(([, ex]) => ex),
  ) as Record<string, NonNullable<ReturnType<typeof getExercise>>>;

  const swaps = Object.fromEntries(
    exerciseIds.map((eid) => [eid, allowedSubstitutes(eid, profile.injuries)]),
  );

  const program = getProgram(workout.programId);
  const phase = program?.phases.find((p) => p.weeks.includes(workout.week));
  const { decisions } = suggestionsForExercises(
    user.id,
    exerciseIds.map((eid) => ({
      exerciseId: eid,
      targetRpe: sets.find((s) => s.exerciseId === eid)?.targetRpe ?? 8,
      reps: sets.find((s) => s.exerciseId === eid)?.targetReps ?? "8",
    })),
  );

  return (
    <AppShell user={user} profile={profile}>
      <WorkoutPlayer
        workoutId={workout.id}
        dayName={workout.dayName}
        week={workout.week}
        phase={phase?.name ?? "Training"}
        units={profile.units}
        sets={sets}
        exercises={exercises}
        swaps={swaps}
        estimatedMinutes={estimateSessionMinutes(
          exerciseIds.map((eid) => ({
            exerciseId: eid,
            sets: sets.filter((s) => s.exerciseId === eid).length,
            reps: sets.find((s) => s.exerciseId === eid)?.targetReps ?? "8",
            targetRpe: sets.find((s) => s.exerciseId === eid)?.targetRpe ?? 8,
            priority: 2,
          })),
        )}
        decisions={decisions}
        aiAvailable={aiEnabled()}
      />
    </AppShell>
  );
}