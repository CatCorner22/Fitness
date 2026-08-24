import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SpiritMascot } from "@/components/spirit-mascot";
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
      <div className="mx-auto max-w-lg text-center">
        <SpiritMascot mood={prs.length ? "celebrate" : "proud"} size={112} className="mx-auto" />
        <p className="mt-4 text-sm uppercase tracking-[0.18em] text-copper">Session saved</p>
        <h1 className="display mt-2 text-4xl">{workout.dayName}</h1>
        <p className="mt-2 text-muted">
          Week {workout.week} · {stats.totalSets} sets · {stats.exercises} exercises
          {workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ""}
          {workout.sessionRpe != null ? ` · sRPE ${workout.sessionRpe}` : ""}
        </p>

        {prs.length > 0 ? (
          <section className="mt-8 rounded-3xl border border-copper/30 bg-surface p-6 text-left">
            <h2 className="text-lg text-copper-2">New PRs</h2>
            <ul className="mt-4 space-y-3">
              {prs.map((pr) => (
                <li key={pr.exerciseId} className="rounded-2xl bg-bg-2 p-4">
                  <p className="font-medium">{pr.exerciseName}</p>
                  <p className="display text-2xl">
                    {formatWeight(pr.weightKg, profile.units)} × {pr.reps}
                  </p>
                  <p className="text-xs text-muted">
                    e1RM {formatWeight(pr.e1rm, profile.units)}
                    {pr.previousE1rm != null
                      ? ` · was ${formatWeight(pr.previousE1rm, profile.units)}`
                      : " · first logged"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="mt-8 rounded-3xl border border-line bg-surface p-6 text-sm text-muted">
            Solid work. No estimated-1RM records today — consistency beats hero sets.
          </p>
        )}

        {workout.notes ? (
          <p className="mt-4 text-sm italic text-muted">&ldquo;{workout.notes}&rdquo;</p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-2xl bg-copper px-6 py-3 font-semibold text-bg">
            Back to Today
          </Link>
          <Link href="/progress" className="rounded-2xl border border-line px-6 py-3 text-muted">
            View progress
          </Link>
          <Link href="/coach" className="rounded-2xl border border-line px-6 py-3 text-muted">
            Ask Spirit
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
