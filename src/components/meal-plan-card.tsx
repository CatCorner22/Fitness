import { applyMealPlanAction } from "@/app/actions/nutrition";
import { MEAL_SLOTS, type ScaledPlanItem } from "@/lib/nutrition/meal-plans";

export function MealPlanCard({
  planId,
  name,
  description,
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
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <p className="mt-2 text-sm text-muted">
        {Math.round(totals.calories)} kcal · {Math.round(totals.protein)} g protein
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-muted">See the meals</summary>
        <div className="mt-3 space-y-3">
          {MEAL_SLOTS.map((meal) => {
            const rows = items.filter((i) => i.meal === meal);
            if (!rows.length) return null;
            return (
              <div key={meal}>
                <p className="text-sm font-medium capitalize">{meal}</p>
                <ul className="mt-1 space-y-0.5 text-sm text-muted">
                  {rows.map((row, idx) => (
                    <li key={`${row.meal}-${row.foodId}-${idx}`}>
                      {row.servings}× {row.foodName}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </details>
      <form action={applyMealPlanAction} className="mt-5 space-y-2">
        <input type="hidden" name="planId" value={planId} />
        <button className="btn-primary" type="submit">
          {hasLogs ? "Add missing meals" : "Use this menu"}
        </button>
        {hasLogs ? (
          <button className="btn-quiet w-full" type="submit" name="replace" value="1">
            Replace today&apos;s food
          </button>
        ) : null}
      </form>
    </article>
  );
}
