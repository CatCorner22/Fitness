// Deterministic session gauges — Byte-style instrument readings before the LLM speaks.

import { suggestNextLoad } from "@/lib/autoregulation";
import { getExercise } from "@/lib/exercises/registry";
import { formatRest } from "@/lib/utils";
import type { SpiritMode } from "./router";

export type SpiritMood = "proud" | "encouraging" | "caution" | "celebrate" | "thinking";

export interface SpiritGaugeNote {
  why: string;
  next?: string;
}

export interface SpiritGauges {
  sessionProgress: number;
  rpeDrift: number;
  timeBudgetUsed: number;
  onTrack: boolean;
  notes: {
    progress: SpiritGaugeNote;
    rpe: SpiritGaugeNote;
    time: SpiritGaugeNote;
  };
}

export interface SpiritInstrumentAdvice {
  message: string;
  why: string;
  restSeconds: number;
  nextAction: SpiritLiveAction;
  weightDeltaKg: number | null;
  swapToExerciseId: string | null;
  mood: SpiritMood;
  citeIds: string[];
}

export type SpiritLiveAction =
  | "repeat_load"
  | "add_weight"
  | "drop_weight"
  | "drop_set"
  | "swap_exercise"
  | "skip_optional"
  | "extend_rest";

export function measureGauges(input: {
  setIndex: number;
  totalSets: number;
  elapsedMinutes: number;
  sessionMinutesBudget: number;
  remainingExercises: number;
  rpe: number | null;
  targetRpe: number;
}): SpiritGauges {
  const sessionProgress = Math.min(1, (input.setIndex + 1) / Math.max(1, input.totalSets));
  const rpeDrift =
    input.rpe != null ? (input.rpe - input.targetRpe) / Math.max(1, input.targetRpe) : 0;
  const timeBudgetUsed = input.elapsedMinutes / Math.max(1, input.sessionMinutesBudget);
  const onTrack = timeBudgetUsed <= sessionProgress + 0.15 || input.remainingExercises <= 1;

  return {
    sessionProgress,
    rpeDrift,
    timeBudgetUsed,
    onTrack,
    notes: {
      progress: {
        why: `Set ${input.setIndex + 1} of ${input.totalSets} on this lift.`,
        next: sessionProgress < 0.5 ? "Main work still ahead — protect quality." : "Finish strong, don't rush.",
      },
      rpe: {
        why:
          input.rpe == null
            ? "No RPE logged yet."
            : input.rpe > input.targetRpe + 0.5
              ? `RPE ${input.rpe} ran hot vs target ${input.targetRpe}.`
              : input.rpe < input.targetRpe - 0.5
                ? `RPE ${input.rpe} left room vs target ${input.targetRpe}.`
                : `RPE ${input.rpe} on target.`,
        next:
          input.rpe != null && input.rpe >= input.targetRpe + 1
            ? "Drop load or extend rest before the next set."
            : undefined,
      },
      time: {
        why: `${input.elapsedMinutes}/${input.sessionMinutesBudget} min used, ${input.remainingExercises} exercises left.`,
        next: !onTrack ? "Keep every listed drill. Shorten rest if the clock is tight — do not delete work." : undefined,
      },
    },
  };
}

export function instrumentAdvice(input: {
  exerciseId: string;
  setIndex: number;
  totalSets: number;
  targetReps: string;
  targetRpe: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  allowedSwapIds: string[];
  sessionMinutesBudget: number;
  elapsedMinutes: number;
  remainingExercises: number;
  modes: SpiritMode[];
  citeIds: string[];
}): SpiritInstrumentAdvice {
  const ex = getExercise(input.exerciseId);
  const baseRest = ex?.restSeconds ?? 90;
  const load = suggestNextLoad({
    lastWeightKg: input.weightKg,
    lastRpe: input.rpe,
    lastReps: input.reps,
    targetRpe: input.targetRpe,
    targetReps: input.targetReps,
  });

  let restSeconds = baseRest;
  let nextAction: SpiritLiveAction = "repeat_load";
  let weightDeltaKg: number | null = null;
  let mood: SpiritMood = "encouraging";
  let swapToExerciseId: string | null = null;

  if (input.modes.includes("high_rpe") || (input.rpe != null && input.rpe >= input.targetRpe + 1)) {
    restSeconds = Math.min(240, baseRest + 45);
    nextAction = "drop_weight";
    weightDeltaKg = input.weightKg != null ? -Math.max(2.5, input.weightKg * 0.05) : null;
    mood = "caution";
  } else if (input.rpe != null && input.rpe <= input.targetRpe - 1) {
    nextAction = "add_weight";
    weightDeltaKg = ex?.pattern === "isolation" ? 1.25 : 2.5;
    mood = "proud";
  }

  if (input.modes.includes("time_crunch") && !input.modes.includes("high_rpe")) {
    restSeconds = Math.max(60, restSeconds - 30);
  }

  if (input.modes.includes("deload") || input.modes.includes("fatigue")) {
    restSeconds = Math.min(180, restSeconds);
    if (nextAction === "add_weight") {
      nextAction = "repeat_load";
      weightDeltaKg = null;
    }
    mood = "caution";
  }

  if (input.modes.includes("injury") && input.allowedSwapIds.length > 0 && input.rpe != null && input.rpe >= 8) {
    swapToExerciseId = input.allowedSwapIds[0] ?? null;
    if (swapToExerciseId) {
      nextAction = "swap_exercise";
      mood = "caution";
    }
  }

  const gauges = measureGauges(input);
  const paw = mood === "proud" ? "*tail swish*" : mood === "caution" ? "*soft paw tap*" : "*ears perk*";

  return {
    message: `${paw} ${load.reason} Rest ${formatRest(restSeconds)} — I'll watch the clock, nya~`,
    why: gauges.notes.rpe.next ?? gauges.notes.rpe.why,
    restSeconds,
    nextAction,
    weightDeltaKg,
    swapToExerciseId,
    mood,
    citeIds: input.citeIds,
  };
}

export function gaugesToMood(gauges: SpiritGauges, modes: SpiritMode[]): SpiritMood {
  if (modes.includes("injury") || modes.includes("deload")) return "caution";
  if (modes.includes("high_rpe")) return "caution";
  if (gauges.rpeDrift <= -0.1) return "proud";
  if (!gauges.onTrack) return "thinking";
  return "encouraging";
}

export function parseContextFor(input: {
  exerciseId: string;
  exerciseName: string;
  priorSets: { weightKg: number | null; reps: number | null; rpe: number | null; setIndex: number }[];
  setIndex: number;
  totalSets: number;
  targetReps: string;
  targetRpe: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  modes: SpiritMode[];
}): string {
  const lines: string[] = [
    `Exercise: ${input.exerciseName} (${input.exerciseId})`,
    `Current set: ${input.setIndex + 1}/${input.totalSets} target ${input.targetReps} @ RPE ${input.targetRpe}`,
    `Just logged: ${input.weightKg ?? "?"} kg × ${input.reps ?? "?"} @ RPE ${input.rpe ?? "?"}`,
    `Risk modes (deterministic): ${input.modes.join(", ")}`,
  ];
  if (input.priorSets.length) {
    lines.push("Earlier sets today:");
    for (const s of input.priorSets) {
      lines.push(
        `  Set ${s.setIndex + 1}: ${s.weightKg ?? "?"} kg × ${s.reps ?? "?"} RPE ${s.rpe ?? "?"}`,
      );
    }
  }
  return lines.join("\n");
}
