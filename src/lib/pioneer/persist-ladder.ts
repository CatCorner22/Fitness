import fs from "node:fs";
import path from "node:path";
import { applyEscapeStrike, LADDER_CLEAR, type LadderState } from "./ladder";

function dataDir(env: Record<string, string | undefined> = process.env) {
  return env.GARANIMAL_DATA_DIR?.trim() || path.join(process.cwd(), "data");
}

export function ladderFilePath(env: Record<string, string | undefined> = process.env) {
  return path.join(dataDir(env), "pioneer-ladder.json");
}

export function readLadder(env: Record<string, string | undefined> = process.env): LadderState {
  if (env.PIONEER_LADDER_RESET === "1") return LADDER_CLEAR;
  try {
    const raw = fs.readFileSync(ladderFilePath(env), "utf8");
    const parsed = JSON.parse(raw) as LadderState;
    if (typeof parsed.stage !== "number" || typeof parsed.strikes !== "number") return LADDER_CLEAR;
    return parsed;
  } catch {
    return LADDER_CLEAR;
  }
}

export function writeLadder(state: LadderState, env: Record<string, string | undefined> = process.env) {
  const file = ladderFilePath(env);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state), { mode: 0o600 });
}

export function recordPioneerEscape(env: Record<string, string | undefined> = process.env): LadderState {
  const next = applyEscapeStrike(readLadder(env));
  writeLadder(next, env);
  return next;
}
