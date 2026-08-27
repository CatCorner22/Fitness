import { PIONEER_UNAVAILABLE } from "./types";

export const PIONEER_MIN_CHARS = 80;
export const PIONEER_DEBOUNCE_MS = 1800;
export const PIONEER_MAX_CHARS = 20000;

export type PioneerConfig = {
  enabled: boolean;
  model: string;
  reads: number;
  minChars: number;
  debounceMs: number;
};

export function getPioneerConfig(
  env: Record<string, string | undefined> = process.env,
): PioneerConfig {
  const killed = env.PIONEER_DISABLED === "1" || env.PIONEER_KILL === "1";
  const gateway = Boolean(env.AI_GATEWAY_API_KEY || env.OPENAI_API_KEY);
  return {
    enabled: gateway && !killed,
    model: env.GARANIMAL_PIONEER_MODEL ?? env.GARANIMAL_AI_MODEL ?? "openai/gpt-5.4",
    reads: resolvePioneerReads(env),
    minChars: PIONEER_MIN_CHARS,
    debounceMs: PIONEER_DEBOUNCE_MS,
  };
}

export function resolvePioneerReads(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.PIONEER_READS);
  if (!Number.isInteger(n)) return 1;
  return Math.min(3, Math.max(1, n));
}

export function pioneerEnabled(env: Record<string, string | undefined> = process.env) {
  return getPioneerConfig(env).enabled;
}

export { PIONEER_UNAVAILABLE };
