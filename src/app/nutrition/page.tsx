import Link from "next/link";
import { eq, isNull, or } from "drizzle-orm";
import { clearDietAction, setDietStartAction } from "@/app/actions/diet";
import { addCustomFoodAction, copyYesterdayFoodAction, deleteFoodLogAction } from "@/app/actions/nutrition";
import { AppShell } from "@/components/app-shell";
import { FastFoodPicks } from "@/components/fast-food-picks";
import { FastingTimer } from "@/components/fasting-timer";
import { MealFoodForm } from "@/components/meal-food-form";
import { MealPlanCard } from "@/components/meal-plan-card";
import { db } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { isoToLocalInput } from "@/lib/fasting/protocols";
import { adjustmentsForFast, recentFasts, runningFast } from "@/lib/fasting/queries";
import { HISTAMINE_LABEL, histamineLoad } from "@/lib/nutrition/foods";
import { isLowHistamineDiet } from "@/lib/nutrition/diets";
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
    favorite: f.favorite,
    histamine: histamineLoad(f.id),
  }));
  const plans = suggestedPlans(profile.goal, targets.calories, targets.protein, profile.activeDietId);
  const featured = plans[0];
  const extras = plans.slice(1);
  const openFast = runningFast(user.id);
  const fasts = recentFasts(user.id);
  const adjustments = openFast ? adjustmentsForFast(openFast.id, user.id) : [];
  const diet = targets.diet;
  const lowHistamine = isLowHistamineDiet(profile.activeDietId);

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Eat</h1>
      <p className="mt-2 text-muted">{user.displayName}&apos;s food today</p>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">
          {targets.goalTitle}
          {targets.goalLabel !== targets.goalTitle ? ` · ${targets.goalLabel}` : ""}
        </p>
        <p className="display text-4xl">
          {Math.round(day.calories)}
          <span className="text-lg text-muted"> / {targets.calories}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          Protein {Math.round(day.protein)} / {targets.protein} g
        </p>
        <p className="mt-2 text-xs text-muted">{targets.note}</p>
        {diet ? (
          <div className="mt-4 rounded-2xl bg-bg-2 p-4 text-sm">
            <p>
              Day {diet.day} of {diet.program.durationDays}
              {diet.finished ? " — block finished" : ` · ${diet.daysLeft} day${diet.daysLeft === 1 ? "" : "s"} left`}
            </p>
            <p className="mt-1 text-muted">{diet.phase.trainingNote}</p>
            {diet.finished ? (
              <p className="mt-2 text-copper-2">
                {diet.program.afterNote ??
                  "Enroll Reverse (after a peak/cut) or Recomp so this deficit does not become your personality."}
              </p>
            ) : null}
            {lowHistamine && !diet.finished ? (
              <p className="mt-2 text-xs text-muted">
                Fresh-cook rule: eat the same day or freeze in meal-size packs. Fermented dairy, aged cheese,
                spinach, avocado, and leftover fish stay off the default plates. This is not an allergy diagnosis.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href={`/diets/${diet.program.id}`} className="text-copper-2">
                Diet details
              </Link>
              <Link href="/diets" className="text-muted">
                Switch diet
              </Link>
              <form action={clearDietAction}>
                <button className="text-muted" type="submit">
                  Use training-goal calories
                </button>
              </form>
            </div>
            <form action={setDietStartAction} className="mt-3 flex flex-wrap items-end gap-2">
              <label className="block text-xs text-muted">
                Block started
                <input
                  type="date"
                  name="dietStartDate"
                  defaultValue={profile.dietStartDate ?? ""}
                  className="mt-1"
                />
              </label>
              <button className="btn-quiet" type="submit">
                Shift days
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-3 text-sm">
            <Link href="/diets" className="text-copper-2">
              Choose a diet block
            </Link>{" "}
            <span className="text-muted">for a cut, bulk, reverse, peak week, or low-histamine plates.</span>
          </p>
        )}
      </section>

      <div className="mt-6">
        <FastingTimer
          running={openFast ?? null}
          recent={fasts}
          adjustments={adjustments}
          defaultStart={isoToLocalInput(new Date().toISOString())}
        />
      </div>

      {featured ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Suggested menu</h2>
          <div className="mt-3">
            <MealPlanCard
              planId={featured.template.id}
              name={featured.template.name}
              description={featured.template.description}
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

      <FastFoodPicks dietId={profile.activeDietId} goal={profile.goal} lowHistamine={lowHistamine} />

      <div className="mt-6 space-y-4">
        <form action={copyYesterdayFoodAction}>
          <button className="btn-quiet w-full" type="submit">
            Copy yesterday&apos;s food
          </button>
        </form>
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
                        {lowHistamine && histamineLoad(item.foodId) === "high"
                          ? ` · ${HISTAMINE_LABEL.high}`
                          : lowHistamine && histamineLoad(item.foodId) === "caution"
                            ? ` · ${HISTAMINE_LABEL.caution}`
                            : ""}
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
              <MealFoodForm foods={foodList} meal={meal} userId={user.id} preferLowHistamine={lowHistamine} />
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
