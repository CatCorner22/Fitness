import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  allowedPreviewOrigins,
  cookiePolicy,
  isReplitRuntime,
  isTrustedPreviewHost,
  publicOriginFromHeaders,
  sanitizeHost,
} from "../src/lib/runtime.ts";
import { resolveAuthSecret } from "../src/lib/auth-secret.ts";

function expect(condition, message) {
  assert.ok(condition, message);
}

expect(!isReplitRuntime({}), "local env is not Replit");
expect(isReplitRuntime({ REPL_ID: "repl-1" }), "REPL_ID marks Replit");
expect(isReplitRuntime({ REPLIT_DEV_DOMAIN: "abc.janeway.replit.dev" }), "preview domain marks Replit");

const localCookies = cookiePolicy({ NODE_ENV: "development" });
expect(localCookies.sameSite === "lax" && localCookies.secure === false, "local cookies stay Lax");

const replitCookies = cookiePolicy({ NODE_ENV: "development", REPL_ID: "repl-1" });
expect(replitCookies.sameSite === "none" && replitCookies.secure === true, "Replit iframe needs SameSite=None; Secure");

const prodCookies = cookiePolicy({ NODE_ENV: "production" });
expect(prodCookies.sameSite === "lax" && prodCookies.secure === true, "generic production stays Lax + Secure");

expect(sanitizeHost("Evil.com/steal") === null, "hosts cannot contain paths");
expect(sanitizeHost("a.janeway.replit.dev") === "a.janeway.replit.dev", "valid host is kept");
expect(sanitizeHost("A.Janeway.Replit.Dev") === "a.janeway.replit.dev", "hosts are lowercased");
expect(isTrustedPreviewHost("foo.janeway.replit.dev", {}), "nested replit.dev is trusted");
expect(!isTrustedPreviewHost("evil.example", { REPL_ID: "x" }), "random hosts are not trusted");

const internal = "http://0.0.0.0:3000/login";
expect(
  publicOriginFromHeaders({
    requestUrl: internal,
    forwardedHost: "evil.example",
    forwardedProto: "https",
    env: { REPL_ID: "x" },
  }) === "http://0.0.0.0:3000",
  "spoofed forwarded host is ignored",
);

expect(
  publicOriginFromHeaders({
    requestUrl: internal,
    forwardedHost: "abc.janeway.replit.dev",
    forwardedProto: "https",
    env: { REPL_ID: "x" },
  }) === "https://abc.janeway.replit.dev",
  "Replit forwarded host wins over bind address",
);

expect(
  publicOriginFromHeaders({
    requestUrl: internal,
    env: { REPLIT_DEV_DOMAIN: "https://abc.janeway.replit.dev/" },
  }) === "https://abc.janeway.replit.dev",
  "REPLIT_DEV_DOMAIN fills in when forwarded headers are missing",
);

const origins = allowedPreviewOrigins({ REPLIT_DEV_DOMAIN: "abc.janeway.replit.dev" });
expect(origins.includes("**.replit.dev"), "nested Replit wildcard is allowlisted");
expect(origins.includes("abc.janeway.replit.dev"), "current preview host is allowlisted");

expect(resolveAuthSecret({ NODE_ENV: "development" }).length >= 32, "dev fallback is long enough");

let threw = false;
try {
  resolveAuthSecret({ NODE_ENV: "production" });
} catch {
  threw = true;
}
expect(threw, "generic production still requires AUTH_SECRET");

threw = false;
try {
  resolveAuthSecret({ NODE_ENV: "production", AUTH_SECRET: "change-me-to-a-long-random-string" });
} catch {
  threw = true;
}
expect(threw, "placeholder AUTH_SECRET is rejected in generic production");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "garanimal-auth-"));
try {
  const replitEnv = { NODE_ENV: "production", REPL_ID: "repl-xyz", GARANIMAL_DATA_DIR: dataDir };
  const generated = resolveAuthSecret(replitEnv);
  const secretPath = path.join(dataDir, "garanimal.auth-secret");
  expect(generated.length === 64, "generated secret is 32 random bytes encoded as hex");
  expect(generated === resolveAuthSecret(replitEnv), "generated secret persists across restarts");
  expect(fs.existsSync(secretPath), "generated secret is stored beside application data");
  expect((fs.statSync(secretPath).mode & 0o777) === 0o600, "generated secret is owner-readable only");
} finally {
  fs.rmSync(dataDir, { recursive: true, force: true });
}

console.log("assert-runtime: ok");
