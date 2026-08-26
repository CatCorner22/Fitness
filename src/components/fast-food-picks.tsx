"use client";

import { useMemo, useState } from "react";
import { addFoodLogAction } from "@/app/actions/nutrition";
import { HISTAMINE_LABEL } from "@/lib/nutrition/foods";
import {
  FAST_FOOD_RESTAURANTS,
  recommendationsForRestaurant,
  type FastFoodItem,
} from "@/lib/nutrition/fast-food";
import type { Goal } from "@/lib/types";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

export function FastFoodPicks({
  dietId,
  goal,
  lowHistamine,
}: {
  dietId: string | null;
  goal: Goal;
  lowHistamine: boolean;
}) {
  const [restaurantId, setRestaurantId] = useState(FAST_FOOD_RESTAURANTS[0]?.id ?? "cfa");
  const [meal, setMeal] = useState<(typeof MEALS)[number]>("lunch");
  const restaurant = FAST_FOOD_RESTAURANTS.find((row) => row.id === restaurantId) ?? FAST_FOOD_RESTAURANTS[0];
  const items = useMemo(
    () => recommendationsForRestaurant(restaurantId, { dietId, goal }),
    [restaurantId, dietId, goal],
  );

  if (!restaurant) return null;

  return (
    <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">Out to eat</h2>
      <p className="mt-1 text-sm text-muted">
        Protein-forward orders at the usual drive-thrus. Numbers are published menu scoops — sauces and extra
        rice are not included. This is not a daily default.
      </p>
      {lowHistamine ? (
        <p className="mt-2 text-xs text-copper-2">
          Low-histamine block: restaurant food is still leftover-prone and sauced. Least-bad picks are grilled
          chicken eaten immediately, no cheese. Skip if you are in a strict week.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FAST_FOOD_RESTAURANTS.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setRestaurantId(row.id)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              restaurantId === row.id ? "border-copper bg-copper/10 text-copper-2" : "border-line text-muted"
            }`}
          >
            {row.name}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm">{restaurant.blurb}</p>
      <label className="mt-3 block text-xs text-muted">
        Log as
        <select
          value={meal}
          onChange={(e) => setMeal(e.target.value as (typeof MEALS)[number])}
          className="mt-1"
        >
          {MEALS.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </label>
      <ul className="mt-4 space-y-3">
        {items.map((row) => (
          <FastFoodRow key={row.id} item={row} meal={meal} lowHistamine={lowHistamine} />
        ))}
      </ul>
    </section>
  );
}

function FastFoodRow({
  item,
  meal,
  lowHistamine,
}: {
  item: FastFoodItem;
  meal: (typeof MEALS)[number];
  lowHistamine: boolean;
}) {
  return (
    <li className="rounded-2xl bg-bg-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{item.name}</p>
          <p className="mt-1 text-sm text-muted">
            {item.calories} kcal · {item.protein} g protein · {item.carbs} g carbs · {item.fat} g fat
            {lowHistamine
              ? item.leastBadOnLowHistamine
                ? " · least-bad HIT pick"
                : ` · ${HISTAMINE_LABEL[item.histamine]}`
              : ""}
          </p>
        </div>
        <form action={addFoodLogAction}>
          <input type="hidden" name="foodId" value={item.id} />
          <input type="hidden" name="meal" value={meal} />
          <input type="hidden" name="servings" value="1" />
          <button className="rounded-2xl bg-copper px-3 py-2 text-sm text-[color:var(--on-copper)]" type="submit">
            Log
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm">{item.why}</p>
      <p className="mt-1 text-xs text-muted">Order: {item.order}</p>
    </li>
  );
}
