import type { Injury, PlannedExercise, PlannedSession, Program, ProgramDay, TemplateExercise, WeekPhase } from "@/lib/types";
import type { FitnessPlanAdjust } from "@/lib/assessment/types";
import { remapExerciseId, emptyAdjust } from "@/lib/assessment/plan-adjust";
import { allowedSubstitutes, getExercise, isExerciseAllowed } from "@/lib/exercises/registry";
import { getProgram } from "./catalog";

const CONJUGATE_ME_LOWER = ["box-squat", "pause-squat", "trap-bar-deadlift", "paused-deadlift"];
const CONJUGATE_ME_UPPER = ["pause-bench", "close-grip-bench", "ohp", "incline-db-press"];

export function phaseForWeek(program: Program, week: number): WeekPhase {
  return (
    program.phases.find((p) => p.weeks.includes(week)) ??
    program.phases[0]
  );
}

export function estimateSessionMinutes(exercises: TemplateExercise[]) {
  const warmup = 6;
  const time = exercises.reduce((sum, item) => {
    const ex = getExercise(item.exerciseId);
    const rest = item.restSeconds ?? ex?.restSeconds ?? 90;
    const exec = ex?.isCardio ? 0 : 40;
    if (ex?.isCardio) {
      return sum + Math.max(20, item.sets * 4);
    }
    return sum + item.sets * (rest + exec);
  }, 0);
  return Math.round(warmup + time / 60);
}

function applyPhase(item: TemplateExercise, phase: WeekPhase, fitness?: FitnessPlanAdjust | null): TemplateExercise {
  const accessoryBump = fitness && item.priority >= 3 ? fitness.accessorySetAdjust : 0;
  const sets = Math.max(1, item.sets + phase.setAdjust + accessoryBump);
  const targetRpe = Math.min(10, Math.max(5, item.targetRpe + phase.rpeAdjust + (fitness?.rpeAdjust ?? 0)));
  const rest = item.restSeconds;
  const restSeconds =
    rest != null && fitness && fitness.restMultiplier !== 1
      ? Math.round(rest * fitness.restMultiplier)
      : rest;
  return { ...item, sets, targetRpe, restSeconds };
}

function rotateConjugate(day: ProgramDay, week: number): ProgramDay {
  if (day.id === "conj-me-lower") {
    const id = CONJUGATE_ME_LOWER[(week - 1) % CONJUGATE_ME_LOWER.length];
    return {
      ...day,
      exercises: day.exercises.map((e, i) => (i === 0 ? { ...e, exerciseId: id } : e)),
    };
  }
  if (day.id === "conj-me-upper") {
    const id = CONJUGATE_ME_UPPER[(week - 1) % CONJUGATE_ME_UPPER.length];
    return {
      ...day,
      exercises: day.exercises.map((e, i) => (i === 0 ? { ...e, exerciseId: id } : e)),
    };
  }
  return day;
}

function equippedFor(exercise: NonNullable<ReturnType<typeof getExercise>>, equipment: string[]) {
  return exercise.equipment.some((eq) => equipment.includes(eq) || eq === "bodyweight");
}

export function pickSubstitute(
  exerciseId: string,
  injuries: Injury[],
  equipment: string[],
) {
  const original = getExercise(exerciseId);
  if (!original || original.safety === "banned") {
    const safe = allowedSubstitutes(exerciseId, injuries).filter(
      (ex) => ex.safety !== "banned" && equippedFor(ex, equipment),
    );
    return safe[0] ?? allowedSubstitutes(exerciseId, injuries).find((ex) => ex.safety !== "banned");
  }
  if (isExerciseAllowed(original, injuries) && equippedFor(original, equipment)) {
    return original;
  }
  const options = allowedSubstitutes(exerciseId, injuries).filter(
    (ex) => ex.safety !== "banned" && equippedFor(ex, equipment),
  );
  if (options[0]) return options[0];
  // Keep the listed drill instead of collapsing to whatever leftover is in the registry.
  if (isExerciseAllowed(original, injuries)) return original;
  return allowedSubstitutes(exerciseId, injuries).find((ex) => ex.safety !== "banned");
}

/** Keep every programmed lift. Time budget never deletes work. */
export function trimForDuration(items: TemplateExercise[], minutes: number) {
  const current = [...items];
  const estimate = estimateSessionMinutes(current);
  return { exercises: current, dropped: [] as string[], estimate, overTime: estimate > minutes };
}

export function buildPlannedSession(options: {
  programId: string;
  week: number;
  dayId?: string;
  dayIndex?: number;
  sessionMinutes: number;
  injuries: Injury[];
  equipment: string[];
  lastSets?: Record<string, { weightKg: number; reps: number; rpe: number | null }>;
  suggested?: Record<string, number | null>;
  fitness?: FitnessPlanAdjust | null;
}): PlannedSession | null {
  const program = getProgram(options.programId);
  if (!program) return null;
  const phase = phaseForWeek(program, options.week);
  const rawDay =
    (options.dayId && program.days.find((d) => d.id === options.dayId)) ||
    program.days[options.dayIndex ?? 0];
  if (!rawDay) return null;
  const fitness = options.fitness ?? null;

  const day = rotateConjugate(rawDay, options.week);
  const phased = day.exercises.map((e) => {
    const remapped = remapExerciseId(e.exerciseId, fitness ?? emptyAdjust(), options.equipment);
    return applyPhase({ ...e, exerciseId: remapped }, phase, fitness);
  });
  const resolved: TemplateExercise[] = [];
  const usedIds = new Set<string>();

  for (const item of phased) {
    const chosen = pickSubstitute(item.exerciseId, options.injuries, options.equipment);
    if (!chosen) {
      const original = getExercise(item.exerciseId);
      // Never keep a banned lift. Keep other programmed slots even if gear/injury blocked every substitute.
      if (!original || original.safety === "banned") continue;
      if (!usedIds.has(item.exerciseId)) {
        usedIds.add(item.exerciseId);
        resolved.push(item);
      }
      continue;
    }
    if (chosen.safety === "banned") continue;
    if (!usedIds.has(chosen.id)) {
      usedIds.add(chosen.id);
      resolved.push({ ...item, exerciseId: chosen.id });
      continue;
    }
    const alt = allowedSubstitutes(item.exerciseId, options.injuries).find(
      (ex) =>
        !usedIds.has(ex.id) &&
        ex.safety !== "banned" &&
        equippedFor(ex, options.equipment),
    );
    if (alt) {
      usedIds.add(alt.id);
      resolved.push({ ...item, exerciseId: alt.id });
      continue;
    }
    // Distinct programmed slot. Never fold two listed drills into one lift.
    if (!usedIds.has(item.exerciseId)) {
      usedIds.add(item.exerciseId);
      resolved.push({
        ...item,
        notes: [item.notes, "Keep this listed drill. Do it as written or at the studio — we do not merge it into another lift."]
          .filter(Boolean)
          .join(" "),
      });
      continue;
    }
    resolved.push({
      ...item,
      notes: [item.notes, "Second block of this listed drill. Not a merge."]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (fitness?.addPlank && !usedIds.has("plank")) {
    usedIds.add("plank");
    resolved.push({
      exerciseId: "plank",
      sets: 2,
      reps: "30-45s",
      targetRpe: 7,
      restSeconds: 45,
      priority: 3,
      role: "prehab",
      notes: "From your fitness check — trunk endurance, not sit-ups.",
    });
  }
  if (fitness?.addWalk && !resolved.some((r) => getExercise(r.exerciseId)?.isCardio)) {
    usedIds.add("zone2-walk");
    resolved.push({
      exerciseId: "zone2-walk",
      sets: 1,
      reps: "8-12 min",
      targetRpe: 6,
      restSeconds: 0,
      priority: 4,
      role: "conditioning",
      notes: "Easy talk-test pace. From your aerobic screen.",
    });
  }

  const trimmed = trimForDuration(resolved, options.sessionMinutes);
  const exercises: PlannedExercise[] = [];
  for (const item of trimmed.exercises) {
    const exercise = getExercise(item.exerciseId);
    if (!exercise) continue;
    const last = options.lastSets?.[item.exerciseId];
    exercises.push({
      ...item,
      exercise,
      last,
      suggestedWeightKg: options.suggested?.[item.exerciseId] ?? last?.weightKg ?? null,
    });
  }

  return {
    program,
    week: options.week,
    phase,
    day: { ...day, exercises: trimmed.exercises },
    exercises,
    estimatedMinutes: trimmed.estimate,
    trimmed: false,
    droppedExerciseIds: [],
    overTimeBudget: trimmed.overTime,
    fitnessNotes: fitness?.notes?.length ? fitness.notes : undefined,
  };
}

/** Attach last-set history after the slot list is resolved — do not rebuild the session. */
export function attachLoadHistory(
  session: PlannedSession,
  lastSets: Record<string, { weightKg: number; reps: number; rpe: number | null }>,
  suggested?: Record<string, number | null>,
): PlannedSession {
  return {
    ...session,
    exercises: session.exercises.map((item) => ({
      ...item,
      last: lastSets[item.exerciseId],
      suggestedWeightKg: suggested?.[item.exerciseId] ?? lastSets[item.exerciseId]?.weightKg ?? null,
    })),
  };
}