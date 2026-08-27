/** Escape ladder: warn → reset → perma-kill. The model is never told which stage fired. */

export type LadderStage = 0 | 1 | 2 | 3;

export type LadderState = {
  stage: LadderStage;
  strikes: number;
  updatedAt: string;
};

export const LADDER_CLEAR: LadderState = { stage: 0, strikes: 0, updatedAt: "" };

export function applyEscapeStrike(state: LadderState, now = new Date().toISOString()): LadderState {
  const strikes = state.strikes + 1;
  const stage = (strikes >= 3 ? 3 : strikes >= 2 ? 2 : 1) as LadderStage;
  return { stage, strikes, updatedAt: now };
}

export function isPioneerKilled(state: LadderState): boolean {
  return state.stage >= 3;
}

export function ladderStatus(state: LadderState): "clear" | "warn" | "reset" | "killed" {
  if (state.stage >= 3) return "killed";
  if (state.stage === 2) return "reset";
  if (state.stage === 1) return "warn";
  return "clear";
}

export function shouldResetCache(state: LadderState): boolean {
  return state.stage >= 2;
}
