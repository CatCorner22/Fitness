import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEV_FALLBACK = "garanimal-dev-secret-change-me-please-32b";
const PLACEHOLDERS = new Set([DEV_FALLBACK, "change-me-to-a-long-random-string"]);

let warnedReplitSecret = false;

function isUsableSecret(value: string): boolean {
  return value.length >= 32 && !PLACEHOLDERS.has(value);
}

function errorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String(error.code);
  }
  return undefined;
}

function secretDataDir(env: NodeJS.ProcessEnv): string {
  const explicitDbPath = env.DATABASE_PATH?.trim();
  if (explicitDbPath) return path.dirname(path.resolve(explicitDbPath));
  // turbopackIgnore: the data dir only exists at runtime; without the opt-out
  // this dynamic path pulls the whole project (public/ included) into the
  // traced server output.
  return path.resolve(/* turbopackIgnore: true */ env.GARANIMAL_DATA_DIR?.trim() || path.join(process.cwd(), "data"));
}

function readPersistedSecret(secretPath: string): string | null {
  try {
    const value = fs.readFileSync(secretPath, "utf8").trim();
    if (!isUsableSecret(value)) {
      throw new Error(`Persisted auth secret at ${secretPath} is invalid.`);
    }
    fs.chmodSync(secretPath, 0o600);
    return value;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return null;
    throw error;
  }
}

function persistedReplitSecret(env: NodeJS.ProcessEnv): string {
  const secretPath = path.join(secretDataDir(env), "garanimal.auth-secret");
  try {
    fs.mkdirSync(path.dirname(secretPath), { recursive: true, mode: 0o700 });
    const existing = readPersistedSecret(secretPath);
    if (existing) return existing;

    const generated = randomBytes(32).toString("hex");
    const fd = fs.openSync(secretPath, "wx", 0o600);
    try {
      fs.writeFileSync(fd, `${generated}\n`, "utf8");
    } finally {
      fs.closeSync(fd);
    }
    return generated;
  } catch (error) {
    if (errorCode(error) === "EEXIST") {
      const existing = readPersistedSecret(secretPath);
      if (existing) return existing;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `AUTH_SECRET is missing and Garanimal could not create a persisted Replit secret at ${secretPath}: ${message}`,
    );
  }
}

/** HMAC secret string for session JWTs. Production requires a configured secret outside Replit. */
export function resolveAuthSecret(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.AUTH_SECRET?.trim() || "";
  if (isUsableSecret(value)) return value;

  if (env.NODE_ENV === "production") {
    const replit = Boolean(env.REPL_ID || env.REPLIT_DEV_DOMAIN || env.REPLIT_DEPLOYMENT);
    if (replit) {
      if (!warnedReplitSecret) {
        warnedReplitSecret = true;
        console.warn(
          "AUTH_SECRET is missing or a placeholder. Using a locally persisted random secret; set AUTH_SECRET in Secrets before moving or cloning this app.",
        );
      }
      return persistedReplitSecret(env);
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
