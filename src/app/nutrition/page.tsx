import { eq, isNull, or } from "drizzle-orm";
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
  const catalog = db
    .select()
    .from(foods)
    .where(or(isNull(foods.userId), eq(foods.userId, user.id)))
    .all();
  const day = todayNutrition(user.id);
  const targets = adaptiveCalories(user.id, profile);
  const foodList = catalog.map((f) => ({
    id: f.id,
    name: f.name,
    calories: f.calories,
    protein: f.protein,
  }));
  const plans = suggestedPlans(profile.goal, targets.calories, targets.protein);
  const featured = plans[0];
  const extras = plans.slice(1);

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Eat</h1>
      <p className="mt-2 text-muted">{user.displayName}&apos;s food today</p>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">Calories</p>
        <p className="display text-4xl">
          {Math.round(day.calories)}
          <span className="text-lg text-muted"> / {targets.calories}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          Protein {Math.round(day.protein)} / {targets.protein} g
        </p>
      </section>

      {featured ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Suggested menu</h2>
          <div className="mt-3">
            <MealPlanCard
              planId={featured.template.id}
              name={featured.template.name}
              description={featured.template.description}
              calories={targets.calories}
              protein={targets.protein}
              totals={featured.totals}
              items={featured.items}
              hasLogs={day.logs.length > 0}
            />
          </div>
          {extras.length ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-muted">Other menus</summary>
              <div className="mt-3 space-y-3">
                {extras.map((plan) => (
                  <MealPlanCard
                    key={plan.template.id}
                    planId={plan.template.id}
                    name={plan.template.name}
                    description={plan.template.description}
                    calories={targets.calories}
                    protein={targets.protein}
                    totals={plan.totals}
                    items={plan.items}
                    hasLogs={day.logs.length > 0}
                  />
                ))}
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

      <div className="mt-6 space-y-4">
        {MEALS.map((meal) => {
          const items = day.logs.filter((l) => l.meal === meal);
          const mealCals = items.reduce((s, l) => s + l.calories, 0);
          return (
            <section key={meal} className="rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="capitalize font-semibold">{meal}</h2>
                <p className="text-sm text-muted">{Math.round(mealCals)} kcal</p>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {items.length === 0 && <li className="text-muted">Nothing yet.</li>}
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>
                      {item.foodName}
                      <span className="block text-sm text-muted">
                        {Math.round(item.calories)} kcal · {Math.round(item.protein)} g protein
                      </span>
                    </span>
                    <form action={deleteFoodLogAction.bind(null, item.id)}>
                      <button className="text-sm text-muted" type="submit">
                        remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
              <MealFoodForm foods={foodList} meal={meal} userId={user.id} />
            </section>
          );
        })}
      </div>

      <details className="mt-6 rounded-3xl border border-line bg-surface p-5">
        <summary className="cursor-pointer font-semibold">Add a custom food</summary>
        <form action={addCustomFoodAction} className="mt-4 space-y-3">
          <input name="name" placeholder="Name" required />
          <input name="serving" placeholder="Serving (e.g. 1 bowl)" />
          <input name="calories" type="number" placeholder="kcal" required />
          <input name="protein" type="number" step="0.1" placeholder="protein g" />
          <input name="carbs" type="number" step="0.1" placeholder="carbs g" />
          <input name="fat" type="number" step="0.1" placeholder="fat g" />
          <button className="rounded-2xl border border-line px-4 py-3" type="submit">
            Save food
          </button>
        </form>
      </details>
    </AppShell>
  );
}
