import { createHash } from "node:crypto";

const DEV_FALLBACK = "garanimal-dev-secret-change-me-please-32b";
const PLACEHOLDERS = new Set([DEV_FALLBACK, "change-me-to-a-long-random-string"]);

let warnedReplitSecret = false;

function replitDerivedSecret(replId: string): string {
  return createHash("sha256").update(`garanimal-replit:${replId}`).digest("hex");
}

/** HMAC secret string for session JWTs. Production refuses missing placeholders unless this is a Replit. */
export function resolveAuthSecret(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.AUTH_SECRET?.trim() || "";
  const replId = env.REPL_ID?.trim() || "";
  const usable = value && !PLACEHOLDERS.has(value) && value.length >= 32;

  if (usable) return value;

  if (env.NODE_ENV === "production") {
    if (replId) {
      if (!warnedReplitSecret) {
        warnedReplitSecret = true;
        console.warn(
          "AUTH_SECRET is missing or a placeholder. Using a per-Replit derived secret so the app can boot. Set AUTH_SECRET in Secrets to keep sessions if this Repl is forked or moved.",
        );
      }
      return replitDerivedSecret(replId);
    }
    throw new Error(
      "AUTH_SECRET must be a unique string of at least 32 characters in production.",
    );
  }

  return value || DEV_FALLBACK;
}

export function authSecretBytes() {
  return new TextEncoder().encode(resolveAuthSecret());
}
