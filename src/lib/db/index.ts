import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { seedIfNeeded } from "./seed";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "garanimal.db");

function createConnection() {
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = new Database(dbPath);
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
      current_week INTEGER NOT NULL DEFAULT 1
    );
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
  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof createConnection>;
  seeded?: boolean;
};

export const db = globalForDb.db ?? createConnection();
globalForDb.db = db;

if (!globalForDb.seeded) {
  seedIfNeeded(db);
  globalForDb.seeded = true;
}