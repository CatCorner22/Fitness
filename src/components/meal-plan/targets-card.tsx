import Link from "next/link";
import { enrollDietAction } from "@/app/actions/diet";
import { logBodyweightAction } from "@/app/actions/profile";
import type { ProfileRow } from "@/lib/auth";
import { bodyCompOption, progressVerdict, type BodyCompTargets } from "@/lib/nutrition/body-comp";
import { getDiet } from "@/lib/nutrition/diets";
import type { AdaptiveTargets } from "@/lib/nutrition/targets";
import type { BodyCompGoal, DietId } from "@/lib/types";
import { kgToDisplay } from "@/lib/utils";

const SUGGESTED_BLOCK: Record<BodyCompGoal, DietId> = {
  lean: "steady_cut",
  gain: "lean_bulk",
  recomp: "recomp",
  maintain: "recomp",
};

function blockAgrees(goal: BodyCompGoal, category: string) {
  if (goal === "lean") return category === "Cut" || category === "Peak";
  if (goal === "gain") return category === "Surplus";
  return category === "Recomp" || category === "Reverse" || category === "Pattern";
}

function signed(n: number) {
  return `${n >= 0 ? "+" : ""}${n}`;
}

export function TargetsCard({
  profile,
  targets,
  bodyComp,
}: {
  profile: ProfileRow;
  targets: AdaptiveTargets;
  bodyComp: BodyCompTargets;
}) {
  const option = bodyCompOption(bodyComp.goal);
  const diet = targets.diet;
  const suggested = getDiet(SUGGESTED_BLOCK[bodyComp.goal]);
  const agrees = diet ? blockAgrees(bodyComp.goal, diet.program.category) : true;
  const kg = profile.weightKg ?? null;
  const rateDisplay =
    kg && bodyComp.weeklyRatePct !== 0
      ? `${signed(Math.round(bodyComp.weeklyRatePct * 100) / 100)}% of bodyweight a week ≈ ${signed(kgToDisplay(bodyComp.weeklyRateKg, profile.units))} ${profile.units}/week`
      : "hold weight";
  const verdict = progressVerdict({
    goal: bodyComp.goal,
    weightKg: kg,
    targetWeeklyKg: diet && !diet.finished ? (diet.phase.delta * 7) / 7700 : bodyComp.weeklyRateKg,
    observedWeeklyKg: targets.weeklyChangeKg,
    weighIns: targets.weighIns,
    spanDays: targets.weighInSpanDays,
  });
  const fatPct = Math.round(((targets.fat * 9) / Math.max(1, targets.calories)) * 100);
  const carbPct = Math.round(((targets.carbs * 4) / Math.max(1, targets.calories)) * 100);
  const proteinPct = Math.round(((targets.protein * 4) / Math.max(1, targets.calories)) * 100);
  const fiber = Math.round((targets.calories / 1000) * 14);

  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-copper">{option.label}</p>
      <p className="display mt-1 text-4xl">
        {targets.calories}
        <span className="text-lg text-muted"> kcal / day</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        {targets.tdee
          ? `Expenditure ${targets.tdee} kcal ${signed(targets.surplus)} · ${rateDisplay}`
          : "Placeholder until age, height, weight, and sex are set under You."}
      </p>

      {bodyComp.guards.length ? (
        <ul className="mt-4 space-y-2">
          {bodyComp.guards.map((g) => (
            <li key={g.code} className="rounded-2xl border border-danger/40 bg-bg-2 p-3 text-sm">
              {g.message}{" "}
              {g.code === "no-weight" || g.code === "no-tdee" ? (
                <Link href="/settings" className="text-copper-2">
                  Open You →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-2xl bg-bg-2 p-3">
          <dt className="text-xs text-muted">Protein</dt>
          <dd className="text-lg font-semibold">{targets.protein} g</dd>
          <dd className="text-xs text-muted">
            {bodyComp.proteinPerKg} g/kg{bodyComp.ffmKg ? ` · ${Math.round((targets.protein / bodyComp.ffmKg) * 100) / 100} g/kg lean` : ""} · {proteinPct}%
          </dd>
        </div>
        <div className="rounded-2xl bg-bg-2 p-3">
          <dt className="text-xs text-muted">Carbs</dt>
          <dd className="text-lg font-semibold">{targets.carbs} g</dd>
          <dd className="text-xs text-muted">
            {kg ? `${Math.round((targets.carbs / kg) * 10) / 10} g/kg · ` : ""}
            {carbPct}%
          </dd>
        </div>
        <div className="rounded-2xl bg-bg-2 p-3">
          <dt className="text-xs text-muted">Fat</dt>
          <dd className="text-lg font-semibold">{targets.fat} g</dd>
          <dd className="text-xs text-muted">
            {kg ? `${Math.round((targets.fat / kg) * 10) / 10} g/kg · ` : ""}
            {fatPct}%
          </dd>
        </div>
        <div className="rounded-2xl bg-bg-2 p-3">
          <dt className="text-xs text-muted">Fiber · water</dt>
          <dd className="text-lg font-semibold">{fiber} g</dd>
          <dd className="text-xs text-muted">~{bodyComp.waterL} L total water</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm">
        <span className="font-medium">{bodyComp.mealsPerDay} meals</span>
        <span className="text-muted">
          {" "}
          · about {Math.round(targets.protein / bodyComp.mealsPerDay)} g protein each (
          {kg ? `${Math.round((targets.protein / bodyComp.mealsPerDay / kg) * 100) / 100} g/kg` : "0.4–0.55 g/kg is the target"}
          ). Put one meal within a couple of hours before and after training.
        </span>
      </p>

      {bodyComp.notes.length ? (
        <ul className="mt-4 space-y-1 text-sm text-muted">
          {bodyComp.notes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 rounded-2xl border border-line bg-bg-2 p-4 text-sm">
        {diet ? (
          <>
            <p>
              Calories are being set by the <strong>{diet.program.name}</strong> block
              {diet.finished ? " (finished)" : ` · ${diet.phase.name}, ${signed(diet.phase.delta)} kcal`}.
            </p>
            {!agrees ? (
              <p className="mt-2 text-copper-2">
                That block points the other way from “{option.label}”. Either switch the block or change the
                answer above — the block wins while it is active.
              </p>
            ) : (
              <p className="mt-2 text-muted">The block and your body-composition answer agree.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href={`/diets/${diet.program.id}`} className="text-copper-2">
                Block details
              </Link>
              <Link href="/diets" className="text-muted">
                Switch block
              </Link>
            </div>
          </>
        ) : suggested ? (
          <>
            <p>
              No time-capped block is active, so these numbers hold until you change the answer. If you want a
              start and an end date, the <strong>{suggested.name}</strong> block matches this goal
              {bodyComp.goal === "lean" ? " and schedules a diet break" : ""}.
            </p>
            <form action={enrollDietAction.bind(null, suggested.id)} className="mt-3">
              <button className="btn-quiet" type="submit">
                Start {suggested.name}
              </button>
            </form>
          </>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-line p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-copper">Weekly check</p>
        <p className="mt-1 font-semibold">{verdict.headline}</p>
        <p className="mt-1 text-sm text-muted">{verdict.detail}</p>
        <form action={logBodyweightAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="next" value="/meal-plan" />
          <label className="block text-xs text-muted">
            Morning weight ({profile.units})
            <input name="weight" type="number" step="0.1" min={20} max={400} className="mt-1 w-32" required />
          </label>
          <button className="btn-quiet" type="submit">
            Log weight
          </button>
        </form>
      </div>
    </section>
  );
}
