import { cookies } from "next/headers";
import { DEFAULT_LOOK, parseLook, type LookPrefs } from "@/lib/look";

const AI_COOKIE = "garanimal_ai";
const THEME_COOKIE = "garanimal_theme";
const LOOK_COOKIE = "garanimal_look";

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

export async function getAiOptIn() {
  return (await cookies()).get(AI_COOKIE)?.value === "1";
}

export async function getTheme(): Promise<"dark" | "light"> {
  return (await cookies()).get(THEME_COOKIE)?.value === "light" ? "light" : "dark";
}

export async function getLook(): Promise<LookPrefs> {
  return parseLook((await cookies()).get(LOOK_COOKIE)?.value) ?? DEFAULT_LOOK;
}

export async function setPrefCookies(
  aiOptIn: boolean | undefined,
  theme: "dark" | "light",
  look?: LookPrefs,
) {
  const jar = await cookies();
  if (aiOptIn !== undefined) {
    jar.set(AI_COOKIE, aiOptIn ? "1" : "0", COOKIE_OPTS);
  }
  jar.set(THEME_COOKIE, theme, COOKIE_OPTS);
  if (look) {
    jar.set(LOOK_COOKIE, JSON.stringify(look), COOKIE_OPTS);
  }
}
