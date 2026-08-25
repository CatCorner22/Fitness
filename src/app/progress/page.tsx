import { and, asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Spark } from "@/components/spark";
import { bestSets, VOLUME_LANDMARKS, weeklyVolume } from "@/lib/autoregulation";
import { db } from "@/lib/db";
import { bodyweightLogs, workouts } from "@/lib/db/schema";
import { getExercise } from "@/lib/exercises/registry";
import { requireAuthed } from "@/lib/session-page";
import { formatWeight, todayISO } from "@/lib/utils";

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return todayISO(d);
}

export default async function ProgressPage() {
  const { user, profile } = await requireAuthed();
  const sessions = db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, user.id), eq(workouts.status, "completed")))
    .orderBy(desc(workouts.date))
    .all();
  const weights = db
    .select()
    .from(bodyweightLogs)
    .where(eq(bodyweightLogs.userId, user.id))
    .orderBy(asc(bodyweightLogs.date))
    .all();
  const volume = weeklyVolume(user.id, weekAgo());
  const best = bestSets(user.id);
  const mainLifts = ["back-squat", "bench-press", "conventional-deadlift", "hip-thrust", "ohp", "pullup"];

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">History</h1>
      <p className="mt-2 text-muted">Sessions you finished.</p>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
        <ul className="space-y-2 text-sm">
          {sessions.length === 0 && <li className="text-muted">No sessions yet.</li>}
          {sessions.slice(0, 20).map((s) => (
            <li key={s.id} className="flex justify-between border-b border-line/50 py-3 last:border-0">
              <Link href={`/progress/${s.id}`} className="hover:text-copper-2">
                {s.date} · {s.dayName}
              </Link>
              <span className="text-muted">{s.durationMinutes ?? "—"} min</span>
            </li>
          ))}
        </ul>
      </section>

      <details className="mt-4 rounded-3xl border border-line bg-surface p-5">
        <summary className="cursor-pointer font-semibold">Best lifts</summary>
        <div className="mt-4 grid gap-3">
          {mainLifts.map((id) => {
            const row = best[id];
            const ex = getExercise(id);
            return (
              <div key={id} className="rounded-2xl bg-bg-2 p-4">
                <p className="text-sm text-muted">{ex?.name}</p>
                <p className="text-2xl font-semibold">
                  {row ? `${formatWeight(row.weightKg, profile.units)} × ${row.reps}` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </details>

      <details className="mt-4 rounded-3xl border border-line bg-surface p-5">
        <summary className="cursor-pointer font-semibold">Weekly volume</summary>
        <ul className="mt-4 space-y-3">
          {Object.entries(VOLUME_LANDMARKS).map(([muscle, marks]) => {
            const n = volume[muscle as keyof typeof volume] ?? 0;
            const max = marks.mrv;
            return (
              <li key={muscle}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{muscle.replace("_", " ")}</span>
                  <span className="text-muted">{n.toFixed(1)} sets</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
                  <div className="h-full bg-copper" style={{ width: `${Math.min(100, (n / max) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </details>

      <details className="mt-4 rounded-3xl border border-line bg-surface p-5">
        <summary className="cursor-pointer font-semibold">Bodyweight</summary>
        <div className="mt-4">
          <Spark values={weights.map((w) => w.weightKg)} />
          <p className="mt-2 text-sm text-muted">{weights.length} weigh-ins</p>
        </div>
      </details>
    </AppShell>
  );
}
