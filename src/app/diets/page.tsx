import Link from "next/link";
import { enrollDietAction } from "@/app/actions/diet";
import { AppShell } from "@/components/app-shell";
import { DIET_PROGRAMS } from "@/lib/nutrition/diets";
import { requireAuthed } from "@/lib/session-page";

const CATEGORY_ORDER = ["Pattern", "Cut", "Peak", "Reverse", "Recomp", "Surplus"] as const;

export default async function DietsPage() {
  const { user, profile } = await requireAuthed();
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    programs: DIET_PROGRAMS.filter((d) => d.category === category),
  })).filter((g) => g.programs.length > 0);

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Diet blocks</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Periodized calories for a cut, bulk, reverse, or a short peak — plus low-histamine fresh-cook plates if fermented and leftover foods flare you. Pick one. Training plans stay separate.
      </p>
      <div className="mt-8 space-y-10">
        {grouped.map((group) => (
          <section key={group.category}>
            <h2 className="text-xs uppercase tracking-[0.16em] text-copper">{group.category}</h2>
            <div className="mt-3 grid gap-4">
              {group.programs.map((diet) => (
                <article key={diet.id} className="rounded-3xl border border-line bg-surface p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="display text-3xl">{diet.name}</h3>
                      <p className="mt-1 text-muted">{diet.tagline}</p>
                    </div>
                    <form action={enrollDietAction.bind(null, diet.id)}>
                      <button
                        className={`rounded-2xl px-4 py-2 text-sm ${
                          profile.activeDietId === diet.id ? "bg-moss text-bg" : "bg-copper text-bg"
                        }`}
                        type="submit"
                      >
                        {profile.activeDietId === diet.id ? "This diet" : "Use this"}
                      </button>
                    </form>
                  </div>
                  <p className="mt-4 text-sm">{diet.description}</p>
                  <p className="mt-3 text-xs text-muted">{diet.evidenceNote}</p>
                  <p className="mt-2 text-xs text-copper-2">{diet.honestNote}</p>
                  <p className="mt-3 text-xs text-muted">{diet.durationDays} days · {diet.phases.length} phases</p>
                  <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                    {diet.phases.map((phase) => (
                      <li key={`${diet.id}-${phase.name}`} className="rounded-2xl bg-bg-2 p-3 text-sm">
                        <strong>{phase.name}</strong>
                        <span className="block text-xs text-muted">
                          Days {phase.startDay}–{phase.endDay} · {phase.delta >= 0 ? "+" : ""}
                          {phase.delta} kcal
                        </span>
                      </li>
                    ))}
                  </ol>
                  <Link href={`/diets/${diet.id}`} className="mt-4 inline-block text-sm text-copper-2">
                    Full block →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
