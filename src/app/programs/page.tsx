import Link from "next/link";
import { enrollProgramAction } from "@/app/actions/profile";
import { AppShell } from "@/components/app-shell";
import { courseForProgram } from "@/lib/course/catalog";
import { getExercise } from "@/lib/exercises/registry";
import { PROGRAMS } from "@/lib/programs/catalog";
import { requireAuthed } from "@/lib/session-page";

const CATEGORY_ORDER = [
  "Performance",
  "Movement",
  "Strength",
  "Hypertrophy",
  "General",
  "Concurrent",
  "Specialization",
];

export default async function ProgramsPage() {
  const { user, profile } = await requireAuthed();
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    programs: PROGRAMS.filter((p) => p.category === category),
  })).filter((g) => g.programs.length > 0);

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Plans</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Pick one. You can switch later under You. Pole and amateur-night plans include a full Nyx course — every drill listed, none cut.
      </p>
      <div className="mt-8 space-y-10">
        {grouped.map((group) => (
          <section key={group.category}>
            <h2 className="text-xs uppercase tracking-[0.16em] text-copper">{group.category}</h2>
            <div className="mt-3 grid gap-4">
              {group.programs.map((program) => (
                <article key={program.id} className="rounded-3xl border border-line bg-surface p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="display text-3xl">{program.name}</h3>
                      <p className="mt-1 text-muted">{program.tagline}</p>
                    </div>
                    <form action={enrollProgramAction.bind(null, program.id)}>
                      <button
                        className={`rounded-2xl px-4 py-2 text-sm ${
                          profile.activeProgramId === program.id
                            ? "bg-moss text-bg"
                            : "bg-copper text-bg"
                        }`}
                        type="submit"
                      >
                        {profile.activeProgramId === program.id ? "This plan" : "Use this"}
                      </button>
                    </form>
                  </div>
                  <p className="mt-4 text-sm">{program.description}</p>
                  <p className="mt-3 text-xs text-muted">{program.evidenceNote}</p>
                  {program.honestNote ? (
                    <p className="mt-2 text-xs text-copper-2">{program.honestNote}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted">
                    {program.daysPerWeek} days · {program.durationWeeks} weeks
                  </p>
                  <ol className="mt-4 grid gap-2">
                    {program.days.map((day) => (
                      <li key={day.id} className="rounded-2xl bg-bg-2 p-3 text-sm">
                        <strong>{day.name}</strong>
                        <span className="block text-xs text-muted">
                          {day.focus} · ~{day.estimatedMinutes} min · {day.exercises.length} drills
                        </span>
                        <span className="mt-1 block text-xs">
                          {day.exercises
                            .map((item) => getExercise(item.exerciseId)?.name ?? item.exerciseId)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link href={`/programs/${program.id}`} className="text-sm text-copper-2">
                      Full week view →
                    </Link>
                    {courseForProgram(program.id) ? (
                      <Link href={`/course/${courseForProgram(program.id)!.id}`} className="text-sm text-copper-2">
                        Nyx course →
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
