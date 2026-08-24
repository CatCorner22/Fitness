import Link from "next/link";
import { addCustomFoodAction, deleteFoodLogAction } from "@/app/actions/nutrition";
import { AppShell } from "@/components/app-shell";
import { MealFoodForm } from "@/components/meal-food-form";
import { MealPlanCard } from "@/components/meal-plan-card";
import { db } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { suggestedPlans } from "@/lib/nutrition/meal-plans";
import { adaptiveCalories } from "@/lib/nutrition/targets";
import { requireAuthed } from "@/lib/session-page";
import { todayNutrition } from "@/lib/today";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

export default async function NutritionPage() {
  const { user, profile } = await requireAuthed();
  const catalog = db.select().from(foods).all();
  const day = todayNutrition(user.id);
  const targets = adaptiveCalories(user.id, profile);
  const calorieGoal = targets.calories;
  const foodList = catalog.map((f) => ({
    id: f.id,
    name: f.name,
    calories: f.calories,
    protein: f.protein,
  }));
  const plans = suggestedPlans(profile.goal, calorieGoal, targets.protein);
  const surplusLabel =
    targets.surplus > 0 ? `+${targets.surplus} kcal surplus` : targets.surplus < 0 ? `${targets.surplus} kcal` : "maintain";

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Nutrition</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Calories follow your goal, not a generic 2000. Protein is set from bodyweight. Meal plans scale to those
        numbers and land in today&apos;s log with one tap.
      </p>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-copper">{targets.goalTitle}</p>
            <p className="mt-1 text-sm text-muted">
              {targets.goalLabel} · {surplusLabel}
              {targets.tdee ? ` · TDEE ${targets.tdee}` : ""}
            </p>
          </div>
          <Link href="/settings" className="text-sm text-copper-2">
            Change goal →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Macro label="Calories" value={Math.round(day.calories)} goal={calorieGoal} />
          <Macro label="Protein" value={Math.round(day.protein)} goal={targets.protein} suffix="g" />
          <Macro label="Carbs" value={Math.round(day.carbs)} goal={targets.carbs} suffix="g" />
          <Macro label="Fat" value={Math.round(day.fat)} goal={targets.fat} suffix="g" />
        </div>
        <p className="mt-4 text-sm text-muted">{targets.goalBlurb}</p>
        <p className="mt-2 text-xs text-muted">{targets.note}</p>
        {targets.weeklyChangeKg != null && (
          <p className="mt-2 text-sm text-copper-2">
            Trend weight: {targets.weeklyChangeKg >= 0 ? "+" : ""}
            {targets.weeklyChangeKg.toFixed(2)} kg/week
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="display text-3xl">Suggested meal plans</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Portions are scaled to {calorieGoal} kcal and {targets.protein} g protein. Fill empty meals keeps what you
          already logged; replace wipes today first.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <MealPlanCard
              key={plan.template.id}
              planId={plan.template.id}
              name={plan.template.name}
              description={plan.template.description}
              calories={calorieGoal}
              protein={targets.protein}
              totals={plan.totals}
              items={plan.items}
              hasLogs={day.logs.length > 0}
            />
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {MEALS.map((meal) => {
          const items = day.logs.filter((l) => l.meal === meal);
          const mealCals = items.reduce((s, l) => s + l.calories, 0);
          return (
            <section key={meal} className="rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="capitalize">{meal}</h2>
                <p className="text-xs text-muted">{Math.round(mealCals)} kcal</p>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {items.length === 0 && <li className="text-muted">Nothing yet.</li>}
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>
                      {item.foodName}
                      <span className="block text-xs text-muted">
                        {Math.round(item.calories)} kcal · {Math.round(item.protein)} g protein
                      </span>
                    </span>
                    <form action={deleteFoodLogAction.bind(null, item.id)}>
                      <button className="text-xs text-muted" type="submit">
                        remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
              <MealFoodForm foods={foodList} meal={meal} />
            </section>
          );
        })}
      </div>

      <form action={addCustomFoodAction} className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-xl">Custom food / favorite</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Name" required />
          <input name="serving" placeholder="Serving (e.g. 1 bowl)" />
          <input name="calories" type="number" placeholder="kcal" required />
          <input name="protein" type="number" step="0.1" placeholder="protein g" />
          <input name="carbs" type="number" step="0.1" placeholder="carbs g" />
          <input name="fat" type="number" step="0.1" placeholder="fat g" />
        </div>
        <button className="mt-4 rounded-2xl border border-line px-4 py-2" type="submit">
          Save food
        </button>
      </form>
    </AppShell>
  );
}

function Macro({
  label,
  value,
  goal,
  suffix = "",
}: {
  label: string;
  value: number;
  goal?: number;
  suffix?: string;
}) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div>
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="display text-3xl">
        {value}
        {suffix}
        {goal ? (
          <span className="text-base text-muted">
            {" "}
            / {goal}
            {suffix}
          </span>
        ) : null}
      </p>
      {goal ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
          <div className="h-full bg-copper" style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}
