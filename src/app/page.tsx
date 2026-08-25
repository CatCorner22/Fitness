import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ExerciseCalendarBlock } from "@/components/exercise-calendar-block";
import { FastingStrip } from "@/components/fasting-timer";
import { SkipWorkoutButton } from "@/components/skip-workout-button";
import { advanceWeekAction } from "@/app/actions/profile";
import { skipWorkoutAction, startWorkoutAction } from "@/app/actions/workout";
import { shouldDeload } from "@/lib/autoregulation";
import { courseForProgram } from "@/lib/course/catalog";
import { lessonForExercise } from "@/lib/course/skills";
import { runningFast } from "@/lib/fasting/queries";
import { requireAuthed } from "@/lib/session-page";
import { todayNutrition, todaysPlan } from "@/lib/today";
import { calorieTarget, macroTargets, nutritionSpec, proteinTargetG } from "@/lib/nutrition/targets";

export default async function TodayPage() {
  const { user, profile } = await requireAuthed();
  const plan = todaysPlan(user.id, profile);
  const food = todayNutrition(user.id);
  const spec = nutritionSpec(profile);
  const targets = macroTargets(calorieTarget(profile), proteinTargetG(profile), spec);
  const planned = plan?.planned;
  const course = courseForProgram(planned?.program.id ?? "");
  const lessonCtx = course
    ? { courseId: course.id, skillIds: course.modules.flatMap((m) => m.skillIds) }
    : undefined;
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
          <p className="mt-4">
            <Link href="/course" className="text-sm text-copper-2">
              Or open Nyx courses
            </Link>
          </p>
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
              {planned.exercises.map((ex) => {
                const lesson = lessonForExercise(ex.exerciseId, lessonCtx);
                return (
                  <li key={`${ex.exerciseId}-${ex.role ?? "x"}`}>
                    {ex.exercise.name}
                    <span className="text-muted">
                      {" "}
                      · {ex.sets} × {ex.reps}
                    </span>
                    {lesson ? (
                      <Link href={lesson.href} className="ml-2 text-xs text-copper-2">
                        How
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {course ? (
            <Link
              href={`/course/${course.id}`}
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

      <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
        <Link href="/nutrition" className="block">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">Eat</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {Math.round(food.calories)} / {targets.calories} kcal
          </p>
          <p className="mt-1 text-sm text-muted">
            Protein {Math.round(food.protein)} / {targets.protein}g
            {spec.label ? ` · ${spec.label}` : ""}
          </p>
        </Link>
      </section>
      {fast ? <div className="mt-4"><FastingStrip running={fast} /></div> : null}
      <ExerciseCalendarBlock userId={user.id} />
    </AppShell>
  );
}
