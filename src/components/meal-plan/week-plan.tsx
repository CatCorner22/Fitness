import Link from "next/link";
import { applyMealPlanAction } from "@/app/actions/nutrition";
import { MEAL_SLOTS, type GroceryLine, type WeeklyPlanDay } from "@/lib/nutrition/meal-plans";

function fmtServings(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

export function WeekPlan({
  days,
  grocery,
  templateCount,
  todayIndex,
  shift,
  hasLogs,
  calories,
  protein,
}: {
  days: WeeklyPlanDay[];
  grocery: GroceryLine[];
  templateCount: number;
  todayIndex: number;
  shift: number;
  hasLogs: boolean;
  calories: number;
  protein: number;
}) {
  if (!days.length) {
    return (
      <section className="rounded-3xl border border-line bg-surface p-5 text-sm text-muted">
        No plates fit this combination yet. Loosen the food pattern or turn off the low-histamine block.
      </section>
    );
  }
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Your week</h2>
        <p className="text-sm text-muted">
          {templateCount} plate{templateCount === 1 ? "" : "s"} rotating · each scaled to {calories} kcal / {protein} g protein
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">
        Every day already hits the targets. Swap foods for others with the same job (chicken for turkey, rice
        for potato) and the numbers barely move.{" "}
        {templateCount > 1 ? (
          <Link href={`/meal-plan?shift=${(shift + 1) % templateCount}`} className="text-copper-2">
            Shuffle which plate lands on Monday
          </Link>
        ) : null}
      </p>

      <div className="mt-4 space-y-2">
        {days.map((d, i) => (
          <details
            key={d.day}
            className="rounded-2xl border border-line bg-bg-2"
            open={i === todayIndex}
          >
            <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2 px-4 py-3">
              <span>
                <span className="font-semibold">{d.day}</span>
                {i === todayIndex ? <span className="ml-2 text-xs uppercase tracking-wider text-copper">today</span> : null}
                <span className="ml-2 text-sm text-muted">{d.template.name}</span>
              </span>
              <span className="text-sm text-muted">
                {Math.round(d.totals.calories)} kcal · P {Math.round(d.totals.protein)} · C {Math.round(d.totals.carbs)} · F{" "}
                {Math.round(d.totals.fat)}
              </span>
            </summary>
            <div className="px-4 pb-4">
              <p className="text-xs text-muted">{d.template.description}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {MEAL_SLOTS.map((meal) => {
                  const rows = d.items.filter((it) => it.meal === meal);
                  if (!rows.length) return null;
                  const mealP = rows.reduce((s, r) => s + r.protein, 0);
                  const mealK = rows.reduce((s, r) => s + r.calories, 0);
                  return (
                    <div key={meal} className="rounded-2xl bg-surface p-3">
                      <p className="flex items-baseline justify-between text-sm">
                        <span className="font-medium capitalize">{meal}</span>
                        <span className="text-xs text-muted">
                          {Math.round(mealK)} kcal · {Math.round(mealP)} g protein
                        </span>
                      </p>
                      <ul className="mt-1 space-y-0.5 text-sm text-muted">
                        {rows.map((row, idx) => (
                          <li key={`${row.meal}-${row.foodId}-${idx}`}>
                            {fmtServings(row.servings)}× {row.foodName}
                            <span className="text-xs"> ({row.serving})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <form action={applyMealPlanAction} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="planId" value={d.template.id} />
                <input type="hidden" name="next" value="/meal-plan" />
                <button className="btn-quiet" type="submit">
                  {hasLogs ? "Add missing meals to today" : "Log this day to today"}
                </button>
                {hasLogs ? (
                  <button className="btn-quiet" type="submit" name="replace" value="1">
                    Replace today&apos;s food
                  </button>
                ) : null}
              </form>
            </div>
          </details>
        ))}
      </div>

      <details className="mt-4 rounded-2xl border border-line bg-bg-2">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Grocery list for the week</summary>
        <ul className="grid gap-1 px-4 pb-4 text-sm sm:grid-cols-2">
          {grocery.map((g) => (
            <li key={g.foodId} className="flex justify-between gap-3">
              <span>{g.foodName}</span>
              <span className="text-muted">
                {fmtServings(g.servings)} × {g.serving}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
