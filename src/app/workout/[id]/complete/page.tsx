import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { workouts } from "@/lib/db/schema";
import { requireAuthed } from "@/lib/session-page";
import { detectWorkoutPRs, workoutSetStats } from "@/lib/workout-summary";
import { formatWeight } from "@/lib/utils";

export default async function WorkoutCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireAuthed();
  const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!workout || workout.userId !== user.id || workout.status !== "completed") notFound();

  const prs = detectWorkoutPRs(user.id, id);
  const stats = workoutSetStats(id);

  return (
    <AppShell user={user} profile={profile}>
      <div className="mx-auto max-w-lg">
        <p className="text-sm text-muted">Saved</p>
        <h1 className="display mt-1 text-4xl">{workout.dayName}</h1>
        <p className="mt-2 text-muted">
          {stats.totalSets} sets
          {workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ""}
        </p>

        {prs.length > 0 ? (
          <section className="mt-8 rounded-3xl border border-line bg-surface p-6">
            <h2 className="font-semibold">Heavier than last time</h2>
            <ul className="mt-4 space-y-3">
              {prs.map((pr) => (
                <li key={pr.exerciseId} className="rounded-2xl bg-bg-2 p-4">
                  <p className="font-medium">{pr.exerciseName}</p>
                  <p className="text-2xl">
                    {formatWeight(pr.weightKg, profile.units)} × {pr.reps}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {workout.notes ? <p className="mt-4 text-sm text-muted">{workout.notes}</p> : null}

        <Link href="/" className="btn-primary mt-8">
          Back to Today
        </Link>
      </div>
    </AppShell>
  );
}
