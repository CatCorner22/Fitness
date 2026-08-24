import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { advanceWeekAction, logBodyweightAction, logCheckinAction } from "@/app/actions/profile";
import { skipWorkoutAction, startWorkoutAction } from "@/app/actions/workout";
import { requireAuthed } from "@/lib/session-page";
import { todayNutrition, todaysPlan } from "@/lib/today";
import { adaptiveCalories } from "@/lib/nutrition/targets";
import { kgToDisplay } from "@/lib/utils";
import { getExercise } from "@/lib/exercises/registry";

export default async function TodayPage() {
  const { user, profile } = await requireAuthed();
  const plan = todaysPlan(user.id, profile);
  const food = todayNutrition(user.id);
  const targets = adaptiveCalories(user.id, profile);
  const planned = plan?.planned;

  return (
    <AppShell user={user} profile={profile}>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-copper">
          {profile.persona === "garanimal" ? "Stay hard" : "Today"}
        </p>
        <h1 className="display text-4xl md:text-5xl">
          {plan?.open ? "You have a session open" : planned ? planned.day.name : "Pick a program"}
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          {planned
            ? `${planned.program.name} · week ${planned.week} · ${planned.phase.name} · ~${planned.estimatedMinutes} min`
            : "Enroll in a program to get a session."}
        </p>
      </div>

      {planned && (
        <section className="rounded-3xl border border-line bg-surface p-6">
          {plan?.allDone ? (
            <div>
              <p className="text-moss">Week complete. Recover, then advance when you are ready.</p>
              <form action={advanceWeekAction} className="mt-4">
                <button className="rounded-2xl bg-copper px-5 py-3 font-semibold text-bg" type="submit">
                  Start next week
                </button>
              </form>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">{planned.day.focus}</p>
              <ul className="mt-4 space-y-2">
                {planned.exercises.map((ex) => (
                  <li key={ex.exerciseId} className="flex justify-between gap-4 border-b border-line/60 py-2 text-sm">
                    <span>
                      {ex.exercise.name}
                      <span className="block text-xs text-muted">
                        {ex.sets} × {ex.reps} @ RPE {ex.targetRpe}
                        {ex.notes ? ` · ${ex.notes}` : ""}
                      </span>
                    </span>
                    <span className="text-muted">
                      {ex.suggestedWeightKg
                        ? `${kgToDisplay(ex.suggestedWeightKg, profile.units)} ${profile.units}`
                        : "choose load"}
                    </span>
                  </li>
                ))}
              </ul>
              {planned.trimmed && (
                <p className="mt-3 text-xs text-copper-2">
                  Trimmed to your {profile.sessionMinutes}-minute budget. Dropped:{" "}
                  {planned.droppedExerciseIds.map((id) => getExercise(id)?.name ?? id).join(", ")}.
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {plan?.open ? (
                  <Link
                    href={`/workout/${plan.open.id}`}
                    className="rounded-2xl bg-copper px-5 py-3 font-semibold text-bg"
                  >
                    Resume workout
                  </Link>
                ) : (
                  <form action={startWorkoutAction.bind(null, planned.day.id)}>
                    <button className="rounded-2xl bg-copper px-5 py-3 font-semibold text-bg" type="submit">
                      Start workout
                    </button>
                  </form>
                )}
                <form
                  action={skipWorkoutAction.bind(
                    null,
                    planned.day.id,
                    planned.day.name,
                    planned.program.id,
                    planned.week,
                  )}
                >
                  <button className="rounded-2xl border border-line px-5 py-3 text-muted" type="submit">
                    Skip today
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-lg">Protein</h2>
          <p className="display text-3xl">
            {Math.round(food.protein)}
            <span className="text-base text-muted"> / {targets.protein} g</span>
          </p>
          <p className="mt-2 text-xs text-muted">
            {Math.round(food.calories)} / {targets.calories ?? "—"} kcal
          </p>
          <Link href="/nutrition" className="mt-3 inline-block text-sm text-copper-2">
            Log food →
          </Link>
        </section>
        <form action={logBodyweightAction} className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-lg">Morning weight</h2>
          <input name="weight" type="number" step="0.1" placeholder={profile.units} className="mt-3" />
          <button className="mt-3 text-sm text-copper-2" type="submit">
            Save
          </button>
        </form>
        <form action={logCheckinAction} className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-lg">Sleep / fatigue</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input name="sleepHours" type="number" step="0.5" placeholder="hours" />
            <input name="fatigue" type="number" min={1} max={5} placeholder="fatigue 1–5" />
          </div>
          <button className="mt-3 text-sm text-copper-2" type="submit">
            Save
          </button>
        </form>
      </div>
    </AppShell>
  );
}