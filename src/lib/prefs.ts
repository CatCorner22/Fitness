import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOOK, parseLook, type LookPrefs } from "@/lib/look";
import { cookiePolicy } from "@/lib/runtime";

const AI_COOKIE = "garanimal_ai";
const THEME_COOKIE = "garanimal_theme";
const LOOK_COOKIE = "garanimal_look";

function prefCookieOpts(httpOnly: boolean) {
  const policy = cookiePolicy();
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: policy.sameSite,
    secure: policy.secure,
    httpOnly,
  };
}

function parseAiMap(raw: string | undefined): Record<string, boolean> {
  if (!raw || raw === "1" || raw === "0") return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, boolean> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      out[id] = value === true || value === 1 || value === "1";
    }
    return out;
  } catch {
    return {};
  }
}

export const getAiOptIn = cache(async (userId: string) => {
  if (!userId) return false;
  const map = parseAiMap((await cookies()).get(AI_COOKIE)?.value);
  return map[userId] === true;
});

export const getTheme = cache(async (): Promise<"dark" | "light"> => {
  return (await cookies()).get(THEME_COOKIE)?.value === "light" ? "light" : "dark";
});

export const getLook = cache(async (): Promise<LookPrefs> => {
  return parseLook((await cookies()).get(LOOK_COOKIE)?.value) ?? DEFAULT_LOOK;
});

export async function setPrefCookies(
  aiOptIn: boolean | undefined,
  theme: "dark" | "light",
  look?: LookPrefs,
  userId?: string,
) {
  const jar = await cookies();
  if (aiOptIn !== undefined && userId) {
    const map = parseAiMap(jar.get(AI_COOKIE)?.value);
    map[userId] = aiOptIn;
    jar.set(AI_COOKIE, JSON.stringify(map), prefCookieOpts(true));
  }
  jar.set(THEME_COOKIE, theme, prefCookieOpts(false));
  if (look) {
    jar.set(LOOK_COOKIE, JSON.stringify(look), prefCookieOpts(false));
  }
}
