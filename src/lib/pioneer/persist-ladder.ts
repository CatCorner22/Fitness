import fs from "node:fs";
import path from "node:path";
import { applyEscapeStrike, LADDER_CLEAR, type LadderState } from "./ladder";

type LadderStore = { users: Record<string, LadderState> };

function dataDir(env: Record<string, string | undefined> = process.env) {
  return env.GARANIMAL_DATA_DIR?.trim() || path.join(process.cwd(), "data");
}

export function ladderFilePath(env: Record<string, string | undefined> = process.env) {
  return path.join(dataDir(env), "pioneer-ladder.json");
}

function emptyStore(): LadderStore {
  return { users: {} };
}

function isLadderState(value: unknown): value is LadderState {
  if (!value || typeof value !== "object") return false;
  const row = value as LadderState;
  return typeof row.stage === "number" && typeof row.strikes === "number";
}

function parseStore(raw: string): LadderStore {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return emptyStore();
    const rec = parsed as Record<string, unknown>;
    if (rec.users && typeof rec.users === "object" && !Array.isArray(rec.users)) {
      const users: Record<string, LadderState> = {};
      for (const [id, value] of Object.entries(rec.users as Record<string, unknown>)) {
        if (isLadderState(value)) {
          users[id] = {
            stage: value.stage,
            strikes: value.strikes,
            updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
          };
        }
      }
      return { users };
    }
    // Legacy process-global file must not kill every household member.
    return emptyStore();
  } catch {
    return emptyStore();
  }
}

function readStore(env: Record<string, string | undefined> = process.env): LadderStore {
  if (env.PIONEER_LADDER_RESET === "1") return emptyStore();
  try {
    return parseStore(fs.readFileSync(ladderFilePath(env), "utf8"));
  } catch {
    return emptyStore();
  }
}

function writeStore(store: LadderStore, env: Record<string, string | undefined> = process.env) {
  const file = ladderFilePath(env);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(store), { mode: 0o600 });
}

export function readLadder(userId: string, env: Record<string, string | undefined> = process.env): LadderState {
  if (!userId) return LADDER_CLEAR;
  return readStore(env).users[userId] ?? LADDER_CLEAR;
}

export function writeLadder(
  userId: string,
  state: LadderState,
  env: Record<string, string | undefined> = process.env,
) {
  if (!userId) return;
  const store = readStore(env);
  store.users[userId] = state;
  writeStore(store, env);
}

export function recordPioneerEscape(
  userId: string,
  env: Record<string, string | undefined> = process.env,
): LadderState {
  const next = applyEscapeStrike(readLadder(userId, env));
  writeLadder(userId, next, env);
  return next;
}
