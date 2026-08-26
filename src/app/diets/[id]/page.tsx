import { notFound } from "next/navigation";
import { clearDietAction, enrollDietAction } from "@/app/actions/diet";
import { AppShell } from "@/components/app-shell";
import { getDiet, isLowHistamineDiet } from "@/lib/nutrition/diets";
import { requireAuthed } from "@/lib/session-page";

export default async function DietDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireAuthed();
  const diet = getDiet(id);
  if (!diet) notFound();
  const active = profile.activeDietId === diet.id;

  return (
    <AppShell user={user} profile={profile}>
      <p className="text-xs uppercase tracking-[0.16em] text-copper">{diet.category}</p>
      <h1 className="display text-4xl">{diet.name}</h1>
      <p className="mt-2 max-w-2xl text-muted">{diet.description}</p>
      <p className="mt-4 text-sm">{diet.evidenceNote}</p>
      <p className="mt-2 text-sm text-copper-2">{diet.honestNote}</p>

      {diet.extremeLean && profile.sex === "female" ? (
        <p className="mt-4 rounded-2xl border border-danger/40 bg-bg-2 p-4 text-sm">
          Sub-6% is not a target for female physiology. Beach week or Steady cut is the honest block. This peak
          still floors calories higher if you enroll it anyway.
        </p>
      ) : null}
      {diet.category === "Pattern" || isLowHistamineDiet(diet.id) ? (
        <p className="mt-4 rounded-2xl border border-line bg-bg-2 p-4 text-sm">
          Food-pattern block, not a diagnosis. Freeze leftovers the day you cook. Allergic swelling, wheeze, or
          hives is emergency care — not a reason to tighten the menu further.
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <form action={enrollDietAction.bind(null, diet.id)}>
          <button className={active ? "btn-quiet" : "btn-primary"} type="submit">
            {active ? "Restart this block" : "Use this diet"}
          </button>
        </form>
        {active ? (
          <form action={clearDietAction}>
            <button className="btn-quiet" type="submit">
              Clear diet
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-8 space-y-4">
        {diet.phases.map((phase) => (
          <section key={phase.name} className="rounded-3xl border border-line bg-surface p-6">
            <h2 className="display text-2xl">{phase.name}</h2>
            <p className="text-sm text-muted">
              Days {phase.startDay}–{phase.endDay} · {phase.delta >= 0 ? "+" : ""}
              {phase.delta} kcal vs TDEE · protein {phase.proteinPerKg} g/kg
            </p>
            <p className="mt-3 text-sm">{phase.note}</p>
            <p className="mt-2 text-sm text-muted">Training: {phase.trainingNote}</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
