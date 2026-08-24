import { and, asc, desc, eq } from "drizzle-orm";
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Progress</h1>
          <p className="mt-2 text-muted">Estimated 1RMs, weekly sets vs landmarks, bodyweight. Export everything.</p>
        </div>
        <a href="/api/export" className="rounded-2xl border border-line px-4 py-2 text-sm">
          Download CSV
        </a>
      </div>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-xl">Estimated 1RM (Epley)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {mainLifts.map((id) => {
            const row = best[id];
            const ex = getExercise(id);
            return (
              <div key={id} className="rounded-2xl bg-bg-2 p-4">
                <p className="text-sm text-muted">{ex?.name}</p>
                <p className="display text-3xl">
                  {row ? formatWeight(row.e1rm, profile.units) : "—"}
                </p>
                {row && (
                  <p className="text-xs text-muted">
                    from {formatWeight(row.weightKg, profile.units)} × {row.reps}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-xl">This week vs landmarks</h2>
        <p className="text-xs text-muted">
          Fractional sets: primary = 1, secondary = 0.5. MEV / MAV / MRV are starting points, not laws.
        </p>
        <ul className="mt-4 space-y-3">
          {Object.entries(VOLUME_LANDMARKS).map(([muscle, marks]) => {
            const n = volume[muscle as keyof typeof volume] ?? 0;
            const max = marks.mrv;
            return (
              <li key={muscle}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{muscle.replace("_", " ")}</span>
                  <span className="text-muted">
                    {n.toFixed(1)} · MEV {marks.mev} / MAV {marks.mav} / MRV {marks.mrv}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
                  <div
                    className="h-full bg-copper"
                    style={{ width: `${Math.min(100, (n / max) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-xl">Bodyweight</h2>
        <Spark values={weights.map((w) => w.weightKg)} />
        <p className="mt-2 text-sm text-muted">{weights.length} weigh-ins</p>
      </section>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-xl">Sessions</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {sessions.length === 0 && <li className="text-muted">No completed sessions yet.</li>}
          {sessions.slice(0, 20).map((s) => (
            <li key={s.id} className="flex justify-between border-b border-line/50 py-2">
              <span>
                {s.date} · {s.dayName}
                <span className="block text-xs text-muted">{s.notes}</span>
              </span>
              <span className="text-muted">
                {s.durationMinutes ?? "—"} min · sRPE {s.sessionRpe ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}