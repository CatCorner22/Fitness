import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { foods, profiles, users } from "./schema";
import { STARTER_FOODS } from "@/lib/nutrition/foods";
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
]);

export function seedIfNeeded(db: Db) {
  const now = new Date().toISOString();
  for (const person of HOUSEHOLD) {
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

  for (const food of STARTER_FOODS) {
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

  for (const person of HOUSEHOLD) {
    const profile = db.select().from(profiles).where(eq(profiles.userId, person.id)).get();
    if (!profile) {
      db.insert(profiles).values({ userId: person.id, equipment: DEFAULT_EQUIPMENT }).onConflictDoNothing().run();
    }
  }
}