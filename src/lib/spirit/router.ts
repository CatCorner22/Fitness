// Deterministic risk routing — strictness is a property of the SESSION STATE, not model opinion.

import { isLowEnergy } from "@/lib/assessment/session-adjust";

export type SpiritMode = "standard" | "injury" | "fatigue" | "time_crunch" | "high_rpe" | "deload";

export type SpiritProfileId = "standard" | "caution" | "strict";

export interface SpiritProfile {
  id: SpiritProfileId;
  minReads: number;
  unanimous: boolean;
}

export function resolveModes(input: {
  injuries: string[];
  fatigue?: number | null;
  rpe?: number | null;
  targetRpe?: number;
  elapsedMinutes: number;
  sessionMinutesBudget: number;
  remainingExercises: number;
  deloadRecommended: boolean;
  exerciseSafety?: "ok" | "caution" | "banned" | "recommended";
}): SpiritMode[] {
  const modes: SpiritMode[] = ["standard"];
  if (input.injuries.length > 0 || input.exerciseSafety === "caution") modes.push("injury");
  if (isLowEnergy(input.fatigue)) modes.push("fatigue");
  if (input.deloadRecommended) modes.push("deload");
  if (input.rpe != null && input.rpe >= 9.5) modes.push("high_rpe");
  if (
    input.elapsedMinutes > input.sessionMinutesBudget - 8 &&
    input.remainingExercises > 1
  ) {
    modes.push("time_crunch");
  }
  return modes;
}

export function resolveProfile(modes: SpiritMode[]): SpiritProfile {
  const highRisk = modes.filter((m) => m !== "standard");
  if (highRisk.includes("injury") && (highRisk.includes("high_rpe") || highRisk.includes("deload"))) {
    return { id: "strict", minReads: 2, unanimous: true };
  }
  if (highRisk.includes("injury") || highRisk.includes("deload") || highRisk.includes("high_rpe")) {
    return { id: "caution", minReads: 2, unanimous: false };
  }
  return { id: "standard", minReads: 1, unanimous: false };
}

export function strictPromptAddendum(modes: SpiritMode[]): string {
  if (modes.length <= 1) return "";
  const tags = modes.filter((m) => m !== "standard").join(" + ");
  return `STRICT READ (${tags}): prioritize safety and recovery. Prefer swap_exercise over pushing load when injury flags match. Never recommend training through pain. Shorter rest only when time_crunch — never when high_rpe or deload.`;
}
