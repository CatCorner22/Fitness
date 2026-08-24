import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { setLogs, workouts } from "@/lib/db/schema";
import { getExercise } from "@/lib/exercises/registry";
import { requireAuthed } from "@/lib/session-page";
import { formatWeight } from "@/lib/utils";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireAuthed();
  const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!workout || workout.userId !== user.id || workout.status === "in_progress") notFound();

  const sets = db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.workoutId, id), eq(setLogs.userId, user.id)))
    .all()
    .sort((a, b) => {
      const exCmp = a.exerciseId.localeCompare(b.exerciseId);
      return exCmp !== 0 ? exCmp : a.setIndex - b.setIndex;
    });

  const grouped = new Map<string, typeof sets>();
  for (const set of sets) {
    const list = grouped.get(set.exerciseId) ?? [];
    list.push(set);
    grouped.set(set.exerciseId, list);
  }

  return (
    <AppShell user={user} profile={profile}>
      <Link href="/progress" className="text-sm text-copper-2">
        ← Progress
      </Link>
      <h1 className="display mt-4 text-4xl">{workout.dayName}</h1>
      <p className="mt-2 text-muted">
        {workout.date} · week {workout.week}
        {workout.status === "skipped" ? " · skipped" : ""}
        {workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ""}
        {workout.sessionRpe != null ? ` · sRPE ${workout.sessionRpe}` : ""}
      </p>
      {workout.notes ? <p className="mt-2 text-sm italic text-muted">{workout.notes}</p> : null}

      {workout.status === "skipped" ? (
        <p className="mt-6 rounded-3xl border border-line bg-surface p-6 text-muted">This session was skipped.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {[...grouped.entries()].map(([exerciseId, rows]) => (
            <section key={exerciseId} className="rounded-3xl border border-line bg-surface p-5">
              <h2 className="text-lg">{getExercise(exerciseId)?.name ?? exerciseId}</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {rows.map((set) => (
                  <li key={set.id} className="flex justify-between border-b border-line/40 py-2 last:border-0">
                    <span className="text-muted">Set {set.setIndex + 1}</span>
                    <span>
                      {set.completed && set.weightKg != null && set.reps != null
                        ? `${formatWeight(set.weightKg, profile.units)} × ${set.reps}${set.rpe != null ? ` @ ${set.rpe}` : ""}`
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
