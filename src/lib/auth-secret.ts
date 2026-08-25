const DEV_FALLBACK = "garanimal-dev-secret-change-me-please-32b";
const PLACEHOLDERS = new Set([DEV_FALLBACK, "change-me-to-a-long-random-string"]);

/** HMAC secret for session JWTs. Production refuses missing or placeholder values. */
export function authSecretBytes() {
  const value = process.env.AUTH_SECRET?.trim() || "";
  if (process.env.NODE_ENV === "production") {
    if (!value || PLACEHOLDERS.has(value) || value.length < 32) {
      throw new Error(
        "AUTH_SECRET must be a unique string of at least 32 characters in production.",
      );
    }
    return new TextEncoder().encode(value);
  }
  return new TextEncoder().encode(value || DEV_FALLBACK);
}
