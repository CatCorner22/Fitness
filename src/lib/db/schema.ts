import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  goal: text("goal").notNull().default("general"),
  experience: text("experience").notNull().default("novice"),
  daysPerWeek: integer("days_per_week").notNull().default(4),
  sessionMinutes: integer("session_minutes").notNull().default(60),
  equipment: text("equipment").notNull().default("[]"),
  injuries: text("injuries").notNull().default("[]"),
  units: text("units").notNull().default("lb"),
  persona: text("persona").notNull().default("scientist"),
  sex: text("sex").notNull().default("unspecified"),
  age: integer("age"),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  onboarded: integer("onboarded").notNull().default(0),
  activeProgramId: text("active_program_id"),
  programStartDate: text("program_start_date"),
  currentWeek: integer("current_week").notNull().default(1),
  assessmentJson: text("assessment_json"),
  fitnessTier: text("fitness_tier"),
  assessedAt: text("assessed_at"),
  activeDietId: text("active_diet_id"),
  dietStartDate: text("diet_start_date"),
  dietWeek: integer("diet_week").notNull().default(1),
});

export const workouts = sqliteTable("workouts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  programId: text("program_id").notNull(),
  dayId: text("day_id").notNull(),
  dayName: text("day_name").notNull(),
  week: integer("week").notNull(),
  date: text("date").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  sessionRpe: real("session_rpe"),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  status: text("status").notNull().default("in_progress"),
});

export const setLogs = sqliteTable("set_logs", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id")
    .notNull()
    .references(() => workouts.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  exerciseId: text("exercise_id").notNull(),
  setIndex: integer("set_index").notNull(),
  targetReps: text("target_reps"),
  targetRpe: real("target_rpe"),
  weightKg: real("weight_kg"),
  reps: integer("reps"),
  rpe: real("rpe"),
  completed: integer("completed").notNull().default(0),
  notes: text("notes"),
});

export const foods = sqliteTable("foods", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  serving: text("serving").notNull().default("1 serving"),
  favorite: integer("favorite").notNull().default(0),
});

export const nutritionLogs = sqliteTable("nutrition_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  meal: text("meal").notNull(),
  foodId: text("food_id"),
  foodName: text("food_name").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  servings: real("servings").notNull().default(1),
});

export const bodyweightLogs = sqliteTable("bodyweight_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  weightKg: real("weight_kg").notNull(),
});

export const dailyCheckins = sqliteTable("daily_checkins", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  sleepHours: real("sleep_hours"),
  fatigue: integer("fatigue"),
  notes: text("notes"),
});

export const coachMessages = sqliteTable("coach_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

export const fitnessAssessments = sqliteTable("fitness_assessments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  takenAt: text("taken_at").notNull(),
  fitnessTier: text("fitness_tier"),
  payload: text("payload").notNull(),
});

export const fasts = sqliteTable("fasts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  protocol: text("protocol").notNull(),
  targetMinutes: integer("target_minutes").notNull(),
  startedAt: text("started_at").notNull(),
  plannedEndAt: text("planned_end_at").notNull(),
  endedAt: text("ended_at"),
  status: text("status").notNull().default("running"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const fastAdjustments = sqliteTable("fast_adjustments", {
  id: text("id").primaryKey(),
  fastId: text("fast_id")
    .notNull()
    .references(() => fasts.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
  kind: text("kind").notNull(),
  summary: text("summary").notNull(),
  payload: text("payload").notNull().default("{}"),
});

export const calendarMarks = sqliteTable("calendar_marks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  fill: text("fill").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const pioneerDrafts = sqliteTable("pioneer_drafts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  kind: text("kind").notNull().default("mixed"),
  updatedAt: text("updated_at").notNull(),
});