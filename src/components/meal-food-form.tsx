"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { addFoodLogAction } from "@/app/actions/nutrition";

type Food = { id: string; name: string; calories: number; protein: number };

const RECENTS_EVENT = "garanimal-recents";

function recentsKey(userId: string) {
  return `garanimal-recent-foods-${userId}`;
}

function readRecents(userId: string): string[] {
  try {
    const raw = localStorage.getItem(recentsKey(userId));
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function rememberFood(userId: string, foodId: string) {
  try {
    const ids = readRecents(userId);
    const next = [foodId, ...ids.filter((id) => id !== foodId)].slice(0, 8);
    localStorage.setItem(recentsKey(userId), JSON.stringify(next));
    window.dispatchEvent(new Event(RECENTS_EVENT));
  } catch {
    /* ignore */
  }
}

function subscribeRecents(onChange: () => void) {
  window.addEventListener(RECENTS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(RECENTS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function MealFoodForm({
  foods,
  meal,
  userId,
}: {
  foods: Food[];
  meal: string;
  userId: string;
}) {
  const [query, setQuery] = useState("");
  const [foodId, setFoodId] = useState("");
  const recentsJson = useSyncExternalStore(
    subscribeRecents,
    () => JSON.stringify(readRecents(userId)),
    () => "[]",
  );
  const recents = useMemo(() => JSON.parse(recentsJson) as string[], [recentsJson]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter((f) => f.name.toLowerCase().includes(q));
  }, [foods, query]);

  const recentFoods = recents.map((id) => foods.find((f) => f.id === id)).filter(Boolean) as Food[];

  return (
    <form
      action={async (formData) => {
        const id = String(formData.get("foodId") || "");
        if (id) rememberFood(userId, id);
        await addFoodLogAction(formData);
      }}
      className="mt-4 space-y-2"
    >
      <input type="hidden" name="meal" value={meal} />
      <input
        type="search"
        placeholder="Search foods..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="py-2 text-sm"
      />
      {recentFoods.length > 0 && !query && (
        <div className="flex flex-wrap gap-1.5">
          {recentFoods.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => setFoodId(food.id)}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                foodId === food.id ? "border-copper bg-copper/10 text-copper-2" : "border-line text-muted"
              }`}
            >
              {food.name.length > 18 ? `${food.name.slice(0, 16)}…` : food.name}
            </button>
          ))}
        </div>
      )}
      <select
        name="foodId"
        required
        value={foodId}
        onChange={(e) => setFoodId(e.target.value)}
        className="text-sm"
      >
        <option value="" disabled>
          Pick a food
        </option>
        {filtered.slice(0, 40).map((food) => (
          <option key={food.id} value={food.id}>
            {food.name} — {Math.round(food.calories)} kcal · {Math.round(food.protein)}g P
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input name="servings" type="number" step="0.5" defaultValue={1} />
        <button className="min-h-12 rounded-xl bg-copper px-4 text-sm font-semibold text-[color:var(--on-copper)]" type="submit">
          Add
        </button>
      </div>
    </form>
  );
}
