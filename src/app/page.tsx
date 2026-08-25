import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FastingStrip } from "@/components/fasting-timer";
import { SkipWorkoutButton } from "@/components/skip-workout-button";
import { advanceWeekAction } from "@/app/actions/profile";
import { skipWorkoutAction, startWorkoutAction } from "@/app/actions/workout";
import { shouldDeload } from "@/lib/autoregulation";
import { runningFast } from "@/lib/fasting/queries";
import { requireAuthed } from "@/lib/session-page";
import { todayNutrition, todaysPlan } from "@/lib/today";
import { calorieTarget, macroTargets, nutritionSpec, proteinTargetG } from "@/lib/nutrition/targets";
import { courseForProgram } from "@/lib/course/catalog";

export default async function TodayPage() {
  const { user, profile } = await requireAuthed();
  const plan = todaysPlan(user.id, profile);
  const food = todayNutrition(user.id);
  const spec = nutritionSpec(profile);
  const targets = macroTargets(calorieTarget(profile), proteinTargetG(profile), spec);
  const planned = plan?.planned;
  const deload = shouldDeload(user.id);
  const open = plan?.open;
  const fast = runningFast(user.id);

  return (
    <AppShell user={user} profile={profile}>
      {!profile.activeProgramId ? (
        <section className="rounded-3xl border border-line bg-surface p-6">
          <h1 className="display text-4xl">Today</h1>
          <p className="mt-3 text-muted">Pick a plan and we will put one workout here.</p>
          <Link href="/programs" className="btn-primary mt-6">
            Choose a plan
          </Link>
        </section>
      ) : plan?.allDone ? (
        <section className="rounded-3xl border border-line bg-surface p-6">
          <h1 className="display text-4xl">Week done</h1>
          <p className="mt-3 text-muted">Rest, then start the next week when you want.</p>
          <form action={advanceWeekAction} className="mt-6">
            <button className="btn-primary" type="submit">
              Next week
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-3xl border border-line bg-surface p-6">
          {deload.deload ? <p className="mb-3 text-sm text-muted">Easy week — keep the weights a little lighter.</p> : null}
          <h1 className="display text-[2.6rem] leading-none">{open ? "Workout open" : planned?.day.name}</h1>
          <p className="mt-3 text-muted">
            {planned ? `About ${planned.estimatedMinutes} minutes` : "No session yet."}
            {planned?.overTimeBudget
              ? ` — longer than your ${profile.sessionMinutes}-minute cap. We still keep every drill.`
              : ""}
          </p>
          {planned && planned.fitnessNotes?.length ? (
            <p className="mt-3 text-sm text-muted">{planned.fitnessNotes[0]}</p>
          ) : null}
          {planned && planned.exercises.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm">
              {planned.exercises.map((ex) => (
                <li key={`${ex.exerciseId}-${ex.role ?? "x"}`}>
                  {ex.exercise.name}
                  <span className="text-muted">
                    {" "}
                    · {ex.sets} × {ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {courseForProgram(planned?.program.id ?? "") ? (
            <Link
              href={`/course/${courseForProgram(planned!.program.id)!.id}`}
              className="mt-4 inline-block text-sm text-copper-2"
            >
              Nyx course for this plan
            </Link>
          ) : null}
          <div className="mt-8 space-y-3">
            {open ? (
              <Link href={`/workout/${open.id}`} className="btn-primary">
                Resume
              </Link>
            ) : planned ? (
              <form action={startWorkoutAction.bind(null, planned.day.id)}>
                <button className="btn-primary" type="submit">
                  Start
                </button>
              </form>
            ) : null}
            {planned && !open ? (
              <SkipWorkoutButton
                dayId={planned.day.id}
                dayName={planned.day.name}
                programId={planned.program.id}
                week={planned.week}
                skipAction={skipWorkoutAction}
              />
            ) : null}
          </div>
        </section>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/nutrition" className="underline-offset-2 hover:underline">
          Food {Math.round(food.calories)} / {targets.calories} · protein {Math.round(food.protein)} / {targets.protein}g
        </Link>
      </p>
      {fast ? <FastingStrip running={fast} /> : null}
    </AppShell>
  );
}
