import { applyMealPlanAction } from "@/app/actions/nutrition";
import { MEAL_SLOTS, type ScaledPlanItem } from "@/lib/nutrition/meal-plans";

export function MealPlanCard({
  planId,
  name,
  description,
  calories,
  protein,
  totals,
  items,
  hasLogs,
}: {
  planId: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  items: ScaledPlanItem[];
  hasLogs: boolean;
}) {
  return (
    <article className="flex flex-col rounded-3xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg">{name}</h3>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <p className="display text-2xl text-copper-2">{Math.round(totals.calories)}</p>
      </div>
      <p className="mt-2 text-xs text-muted">
        {Math.round(totals.protein)} g P · {Math.round(totals.carbs)} g C · {Math.round(totals.fat)} g F — scaled to
        your {calories} kcal / {protein} g protein target
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {MEAL_SLOTS.map((meal) => {
          const rows = items.filter((i) => i.meal === meal);
          const mealCals = rows.reduce((s, r) => s + r.calories, 0);
          return (
            <div key={meal}>
              <p className="text-xs uppercase tracking-wide text-muted">
                {meal} · {Math.round(mealCals)} kcal
              </p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {rows.map((row, idx) => (
                  <li key={`${row.meal}-${row.foodId}-${idx}`}>
                    {row.servings}× {row.foodName}
                    <span className="text-muted"> ({row.serving})</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <form action={applyMealPlanAction} className="mt-5 flex flex-wrap gap-2">
        <input type="hidden" name="planId" value={planId} />
        <button className="rounded-2xl bg-copper px-4 py-2 text-sm font-semibold text-bg" type="submit">
          {hasLogs ? "Fill empty meals" : "Log this day"}
        </button>
        {hasLogs ? (
          <button
            className="rounded-2xl border border-line px-4 py-2 text-sm text-muted"
            type="submit"
            name="replace"
            value="1"
          >
            Replace today
          </button>
        ) : null}
      </form>
    </article>
  );
}
