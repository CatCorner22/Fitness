const HOST_RE = /^[a-z0-9.-]+(?::\d{1,5})?$/i;
const PREVIEW_SUFFIXES = [".replit.dev", ".repl.co", ".replit.app"] as const;

export function isReplitRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.REPL_ID || env.REPLIT_DEV_DOMAIN || env.REPLIT_DEPLOYMENT);
}

export function cookiePolicy(env: NodeJS.ProcessEnv = process.env): {
  sameSite: "lax" | "none";
  secure: boolean;
} {
  const replit = isReplitRuntime(env);
  // A production build served over plain HTTP on the home LAN (no TLS) cannot
  // set Secure cookies; GARANIMAL_ALLOW_INSECURE_COOKIE=1 opts out. Replit's
  // IDE preview is an iframe on a different site, so it keeps SameSite=None + Secure.
  const allowInsecure = !replit && env.GARANIMAL_ALLOW_INSECURE_COOKIE === "1";
  return {
    sameSite: replit ? "none" : "lax",
    secure: replit || (env.NODE_ENV === "production" && !allowInsecure),
  };
}

export function sanitizeHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const host = raw.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!host || host.includes("..") || !HOST_RE.test(host)) return null;
  return host;
}

function hostnameOnly(host: string): string {
  return host.replace(/:\d+$/, "");
}

function hostFromEnvValue(raw: string | undefined): string | null {
  if (!raw) return null;
  return sanitizeHost(raw.replace(/^https?:\/\//, "").split("/")[0]);
}

export function isTrustedPreviewHost(host: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const name = hostnameOnly(host);
  const configured = hostFromEnvValue(env.REPLIT_DEV_DOMAIN);
  if (configured && name === hostnameOnly(configured)) return true;
  return PREVIEW_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

export function allowedPreviewOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const origins = [
    "127.0.0.1",
    "localhost",
    "**.replit.dev",
    "*.replit.dev",
    "**.repl.co",
    "*.repl.co",
    "**.replit.app",
    "*.replit.app",
  ];
  const domain = hostFromEnvValue(env.REPLIT_DEV_DOMAIN);
  if (domain) origins.push(hostnameOnly(domain));
  return origins;
}

export function publicOriginFromHeaders(input: {
  requestUrl: string;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  env?: NodeJS.ProcessEnv;
}): string {
  const env = input.env ?? process.env;
  const fallback = new URL(input.requestUrl).origin;
  const forwarded = sanitizeHost(input.forwardedHost);
  if (forwarded && isTrustedPreviewHost(forwarded, env)) {
    const protoRaw = (input.forwardedProto ?? "").split(",")[0]?.trim().toLowerCase();
    const proto = protoRaw === "http" || protoRaw === "https" ? protoRaw : "https";
    return `${proto}://${forwarded}`;
  }
  const replitDomain = hostFromEnvValue(env.REPLIT_DEV_DOMAIN);
  if (replitDomain) return `https://${hostnameOnly(replitDomain)}`;
  return fallback;
}
