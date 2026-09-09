import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { foods, profiles, users } from "./schema";
import { STARTER_FOODS } from "@/lib/nutrition/foods";
import { fastFoodCatalogFoods } from "@/lib/nutrition/fast-food";
import type { db as DbType } from "./index";

type Db = typeof DbType;

/**
 * First-boot passwords. Set GARANIMAL_ALEX_PASSWORD / GARANIMAL_JORDAN_PASSWORD
 * (or GARANIMAL_HOUSEHOLD_PASSWORD for both) before the first production boot;
 * afterwards each person changes theirs under You. The seed only runs when the
 * user row does not exist, so changing the env later does not reset anything.
 */
function seedPassword(env: string): string {
  const specific = process.env[env]?.trim();
  if (specific) return specific;
  const shared = process.env.GARANIMAL_HOUSEHOLD_PASSWORD?.trim();
  return shared || "household";
}

const HOUSEHOLD = [
  { id: "user-alex", username: "alex", displayName: "Alex", password: seedPassword("GARANIMAL_ALEX_PASSWORD") },
  { id: "user-jordan", username: "jordan", displayName: "Jordan", password: seedPassword("GARANIMAL_JORDAN_PASSWORD") },
];

export const DEFAULT_HOUSEHOLD_PASSWORD = "household";

/** True when a user still has a default seed password (used to nudge a change). */
export function usesDefaultPassword(passwordHash: string): boolean {
  return bcrypt.compareSync(DEFAULT_HOUSEHOLD_PASSWORD, passwordHash);
}

const DEFAULT_EQUIPMENT = JSON.stringify([
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bench",
  "pullup_bar",
  "hip_thrust_bench",
  "trap_bar",
  "landmine",
  "bands",
  "bodyweight",
  "cardio_machine",
  "pole",
  "backpack",
]);

export function seedStarterFoods(db: Db) {
  const catalog = [...STARTER_FOODS, ...fastFoodCatalogFoods()];
  for (const food of catalog) {
    db.insert(foods)
      .values({
        id: food.id,
        userId: null,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        serving: food.serving,
        favorite: 0,
      })
      .onConflictDoNothing()
      .run();
  }
}

export function seedIfNeeded(db: Db) {
  const now = new Date().toISOString();
  for (const person of HOUSEHOLD) {
    // onConflictDoNothing keeps this safe when several processes (e.g. parallel
    // `next build` workers) seed a fresh database at the same time.
    const exists = db.select({ id: users.id }).from(users).where(eq(users.username, person.username)).get();
    if (!exists) {
      db.insert(users)
        .values({
          id: person.id,
          username: person.username,
          passwordHash: bcrypt.hashSync(person.password, 10),
          displayName: person.displayName,
          createdAt: now,
        })
        .onConflictDoNothing()
        .run();
    }
    db.insert(profiles)
      .values({
        userId: person.id,
        equipment: DEFAULT_EQUIPMENT,
      })
      .onConflictDoNothing()
      .run();
  }

  seedStarterFoods(db);
}