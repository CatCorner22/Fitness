import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { foods, profiles, users } from "./schema";
import { STARTER_FOODS } from "@/lib/nutrition/foods";
import { fastFoodCatalogFoods } from "@/lib/nutrition/fast-food";
import type { db as DbType } from "./index";

type Db = typeof DbType;

const HOUSEHOLD = [
  { id: "user-alex", username: "alex", displayName: "Alex", password: "household" },
  { id: "user-jordan", username: "jordan", displayName: "Jordan", password: "household" },
];

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