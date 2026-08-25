import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);

function time(label, fn) {
  const start = performance.now();
  fn();
  const ms = performance.now() - start;
  console.log(`${label}: ${ms.toFixed(1)} ms`);
  return ms;
}

function explain(db, sql) {
  const rows = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
  console.log(sql);
  for (const row of rows) console.log(" ", row.detail ?? row);
}

if (!isMainThread) {
  const { file, workerId, writes } = workerData;
  const db = new Database(file);
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  const insert = db.prepare("INSERT INTO events (worker, n) VALUES (?, ?)");
  const tx = db.transaction((count) => {
    for (let i = 0; i < count; i++) insert.run(workerId, i);
  });
  tx(writes);
  db.close();
  parentPort?.postMessage("ok");
} else {
  const appDb = path.join(process.cwd(), "data", "garanimal.db");
  if (fs.existsSync(appDb)) {
    const migrate = new Database(appDb);
    migrate.pragma("busy_timeout = 5000");
    migrate.exec(`
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
    migrate.close();

    const db = new Database(appDb, { readonly: true });
    console.log("=== query plans (app db) ===");
    explain(db, "SELECT * FROM workouts WHERE user_id = 'user-alex' AND status = 'in_progress'");
    explain(db, "SELECT * FROM workouts WHERE user_id = 'user-alex' AND program_id = 'p' AND week = 1 AND date >= '2026-08-18'");
    explain(db, "SELECT * FROM set_logs WHERE workout_id = 'x'");
    explain(db, "SELECT * FROM set_logs WHERE user_id = 'user-alex' AND completed = 1");
    explain(
      db,
      "SELECT s.exercise_id, s.weight_kg, s.reps FROM set_logs s JOIN workouts w ON w.id = s.workout_id WHERE s.user_id = 'user-alex' AND s.completed = 1 AND s.exercise_id = 'back-squat' AND w.status = 'completed' ORDER BY w.started_at DESC, s.set_index DESC LIMIT 1",
    );
    explain(db, "SELECT * FROM nutrition_logs WHERE user_id = 'user-alex' AND date = '2026-08-25'");
    explain(db, "SELECT * FROM bodyweight_logs WHERE user_id = 'user-alex' ORDER BY date DESC LIMIT 14");
    time("open workout lookup", () => {
      db.prepare(`SELECT * FROM workouts WHERE user_id = 'user-alex' AND status = 'in_progress'`).get();
    });
    time("today nutrition", () => {
      db.prepare(`SELECT * FROM nutrition_logs WHERE user_id = 'user-alex' AND date = date('now')`).all();
    });
    time("last completed set for one lift", () => {
      db.prepare(
        `SELECT s.exercise_id FROM set_logs s
         JOIN workouts w ON w.id = s.workout_id
         WHERE s.user_id = 'user-alex' AND s.completed = 1 AND s.exercise_id = 'back-squat' AND w.status = 'completed'
         ORDER BY w.started_at DESC, s.set_index DESC LIMIT 1`,
      ).get();
    });
    db.close();
  }

  const tmp = path.join(os.tmpdir(), `garanimal-busy-${Date.now()}.db`);
  const setup = new Database(tmp);
  setup.pragma("journal_mode = WAL");
  setup.pragma("busy_timeout = 5000");
  setup.exec("CREATE TABLE events (id INTEGER PRIMARY KEY, worker INTEGER, n INTEGER)");
  setup.close();

  console.log("=== concurrent writes (4 workers × 400 rows) ===");
  const start = performance.now();
  const workers = Array.from({ length: 4 }, (_, i) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: { file: tmp, workerId: i, writes: 400 },
      });
      worker.on("message", resolve);
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0) reject(new Error(`worker ${i} exit ${code}`));
      });
    });
  });
  await Promise.all(workers);
  const verify = new Database(tmp, { readonly: true });
  const count = verify.prepare("SELECT COUNT(*) AS n FROM events").get();
  verify.close();
  fs.unlinkSync(tmp);
  try {
    fs.unlinkSync(`${tmp}-wal`);
    fs.unlinkSync(`${tmp}-shm`);
  } catch {
    /* ignore */
  }
  console.log(`wrote ${count.n} rows in ${(performance.now() - start).toFixed(1)} ms without SQLITE_BUSY`);
}
