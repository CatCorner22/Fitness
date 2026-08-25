import Link from "next/link";
import { enrollProgramAction } from "@/app/actions/profile";
import { AppShell } from "@/components/app-shell";
import { PROGRAMS } from "@/lib/programs/catalog";
import { requireAuthed } from "@/lib/session-page";

export default async function ProgramsPage() {
  const { user, profile } = await requireAuthed();

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Plans</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Training first. Food blocks live under{" "}
        <Link href="/diets" className="text-copper-2">
          Diet
        </Link>
        .
      </p>
      <div className="mt-8 grid gap-4">
        {PROGRAMS.map((program) => (
          <article key={program.id} className="rounded-3xl border border-line bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-copper">{program.category}</p>
                <h2 className="display text-3xl">{program.name}</h2>
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
            {program.honestNote && (
              <p className="mt-2 text-xs text-copper-2">{program.honestNote}</p>
            )}
            <p className="mt-3 text-xs text-muted">
              {program.daysPerWeek} days · {program.durationWeeks} weeks
            </p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {program.days.map((day) => (
                <li key={day.id} className="rounded-2xl bg-bg-2 p-3 text-sm">
                  <strong>{day.name}</strong>
                  <span className="block text-xs text-muted">
                    {day.focus} · ~{day.estimatedMinutes} min
                  </span>
                </li>
              ))}
            </ol>
            <Link href={`/programs/${program.id}`} className="mt-4 inline-block text-sm text-copper-2">
              Full week view →
            </Link>
          </article>
        ))}
      </div>
    </AppShell>
  );
}