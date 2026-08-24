import type { Injury, PlannedExercise, PlannedSession, Program, ProgramDay, TemplateExercise, WeekPhase } from "@/lib/types";
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

function applyPhase(item: TemplateExercise, phase: WeekPhase): TemplateExercise {
  const sets = Math.max(1, item.sets + phase.setAdjust);
  const targetRpe = Math.min(10, Math.max(5, item.targetRpe + phase.rpeAdjust));
  return { ...item, sets, targetRpe };
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

export function pickSubstitute(
  exerciseId: string,
  injuries: Injury[],
  equipment: string[],
) {
  const original = getExercise(exerciseId);
  if (!original) return undefined;
  if (isExerciseAllowed(original, injuries) && original.equipment.some((eq) => equipment.includes(eq) || eq === "bodyweight")) {
    return original;
  }
  const options = allowedSubstitutes(exerciseId, injuries).filter(
    (ex) => ex.equipment.some((eq) => equipment.includes(eq) || eq === "bodyweight"),
  );
  return options[0] ?? allowedSubstitutes(exerciseId, injuries)[0];
}

export function trimForDuration(items: TemplateExercise[], minutes: number) {
  const dropped: string[] = [];
  let current = [...items];
  let estimate = estimateSessionMinutes(current);
  const dropOrder = [...current].sort((a, b) => b.priority - a.priority);

  for (const candidate of dropOrder) {
    if (estimate <= minutes) break;
    if (candidate.priority <= 2 && current.filter((c) => c.priority <= 2).length <= 2) break;
    current = current.filter((c) => c !== candidate);
    dropped.push(candidate.exerciseId);
    estimate = estimateSessionMinutes(current);
  }

  // Short sessions: slightly shorter rest on isolation
  if (minutes <= 45) {
    current = current.map((c) =>
      c.priority >= 4 ? { ...c, restSeconds: Math.min(c.restSeconds ?? 75, 60) } : c,
    );
  }

  return { exercises: current, dropped, estimate };
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
}): PlannedSession | null {
  const program = getProgram(options.programId);
  if (!program) return null;
  const phase = phaseForWeek(program, options.week);
  const rawDay =
    (options.dayId && program.days.find((d) => d.id === options.dayId)) ||
    program.days[options.dayIndex ?? 0];
  if (!rawDay) return null;

  const day = rotateConjugate(rawDay, options.week);
  const phased = day.exercises.map((e) => applyPhase(e, phase));
  const resolved: TemplateExercise[] = [];

  for (const item of phased) {
    const chosen = pickSubstitute(item.exerciseId, options.injuries, options.equipment);
    if (!chosen) continue;
    resolved.push({ ...item, exerciseId: chosen.id });
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
    trimmed: trimmed.dropped.length > 0,
    droppedExerciseIds: trimmed.dropped,
  };
}

export function nextDayForUser(
  program: Program,
  completedDayIdsInWeek: string[],
) {
  return program.days.find((d) => !completedDayIdsInWeek.includes(d.id)) ?? program.days[0];
}