import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { seedIfNeeded } from "./seed";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "garanimal.db");

const PROFILE_COLUMNS: { name: string; sql: string }[] = [
  { name: "assessment_json", sql: "ALTER TABLE profiles ADD COLUMN assessment_json TEXT" },
  { name: "fitness_tier", sql: "ALTER TABLE profiles ADD COLUMN fitness_tier TEXT" },
  { name: "assessed_at", sql: "ALTER TABLE profiles ADD COLUMN assessed_at TEXT" },
  { name: "active_diet_id", sql: "ALTER TABLE profiles ADD COLUMN active_diet_id TEXT" },
  { name: "diet_start_date", sql: "ALTER TABLE profiles ADD COLUMN diet_start_date TEXT" },
  { name: "diet_week", sql: "ALTER TABLE profiles ADD COLUMN diet_week INTEGER NOT NULL DEFAULT 1" },
];

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS fitness_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      taken_at TEXT NOT NULL,
      fitness_tier TEXT,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_assess_user_taken ON fitness_assessments(user_id, taken_at);
    CREATE TABLE IF NOT EXISTS fasts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      protocol TEXT NOT NULL,
      target_minutes INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      planned_end_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fast_adjustments (
      id TEXT PRIMARY KEY,
      fast_id TEXT NOT NULL REFERENCES fasts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_fasts_user_status ON fasts(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_fasts_user_started ON fasts(user_id, started_at);
    CREATE INDEX IF NOT EXISTS idx_fast_adj_fast ON fast_adjustments(fast_id, created_at);
    CREATE TABLE IF NOT EXISTS calendar_marks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      fill TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_marks_user_date ON calendar_marks(user_id, date);
  `);
  const cols = sqlite.prepare("PRAGMA table_info(profiles)").all() as { name: string }[];
  const names = new Set(cols.map((c) => c.name));
  for (const column of PROFILE_COLUMNS) {
    if (!names.has(column.name)) sqlite.exec(column.sql);
  }
}

function createConnection() {
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = globalForDb.sqlite ?? new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      goal TEXT NOT NULL DEFAULT 'general',
      experience TEXT NOT NULL DEFAULT 'novice',
      days_per_week INTEGER NOT NULL DEFAULT 4,
      session_minutes INTEGER NOT NULL DEFAULT 60,
      equipment TEXT NOT NULL DEFAULT '[]',
      injuries TEXT NOT NULL DEFAULT '[]',
      units TEXT NOT NULL DEFAULT 'lb',
      persona TEXT NOT NULL DEFAULT 'scientist',
      sex TEXT NOT NULL DEFAULT 'unspecified',
      age INTEGER,
      height_cm REAL,
      weight_kg REAL,
      onboarded INTEGER NOT NULL DEFAULT 0,
      active_program_id TEXT,
      program_start_date TEXT,
      current_week INTEGER NOT NULL DEFAULT 1,
      assessment_json TEXT,
      fitness_tier TEXT,
      assessed_at TEXT,
      active_diet_id TEXT,
      diet_start_date TEXT,
      diet_week INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS fitness_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      taken_at TEXT NOT NULL,
      fitness_tier TEXT,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_assess_user_taken ON fitness_assessments(user_id, taken_at);
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      program_id TEXT NOT NULL,
      day_id TEXT NOT NULL,
      day_name TEXT NOT NULL,
      week INTEGER NOT NULL,
      date TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      session_rpe REAL,
      duration_minutes INTEGER,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress'
    );
    CREATE TABLE IF NOT EXISTS set_logs (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL REFERENCES workouts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      exercise_id TEXT NOT NULL,
      set_index INTEGER NOT NULL,
      target_reps TEXT,
      target_rpe REAL,
      weight_kg REAL,
      reps INTEGER,
      rpe REAL,
      completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      serving TEXT NOT NULL DEFAULT '1 serving',
      favorite INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      meal TEXT NOT NULL,
      food_id TEXT,
      food_name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      servings REAL NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS bodyweight_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS daily_checkins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      sleep_hours REAL,
      fatigue INTEGER,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS coach_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_workouts_user_status ON workouts(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_workouts_user_started ON workouts(user_id, started_at);
    CREATE INDEX IF NOT EXISTS idx_workouts_user_program_week ON workouts(user_id, program_id, week, date);
    CREATE INDEX IF NOT EXISTS idx_set_logs_workout ON set_logs(workout_id);
    CREATE INDEX IF NOT EXISTS idx_set_logs_user_completed ON set_logs(user_id, completed);
    CREATE INDEX IF NOT EXISTS idx_set_logs_user_exercise ON set_logs(user_id, exercise_id, completed);
    CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON nutrition_logs(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_bodyweight_user_date ON bodyweight_logs(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON daily_checkins(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_coach_user_created ON coach_messages(user_id, created_at);
  `);
  migrate(sqlite);
  globalForDb.sqlite = sqlite;
  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: ReturnType<typeof createConnection>;
  seeded?: boolean;
};

if (!globalForDb.db) {
  globalForDb.db = createConnection();
} else if (globalForDb.sqlite) {
  migrate(globalForDb.sqlite);
}
export const db = globalForDb.db;

export function ensureMigrated() {
  if (globalForDb.sqlite) migrate(globalForDb.sqlite);
}

if (!globalForDb.seeded) {
  seedIfNeeded(db);
  globalForDb.seeded = true;
}