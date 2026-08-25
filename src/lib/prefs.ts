import { cookies } from "next/headers";

const AI_COOKIE = "garanimal_ai";
const THEME_COOKIE = "garanimal_theme";

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

export async function setPrefCookies(aiOptIn: boolean, theme: "dark" | "light") {
  const jar = await cookies();
  jar.set(AI_COOKIE, aiOptIn ? "1" : "0", COOKIE_OPTS);
  jar.set(THEME_COOKIE, theme, COOKIE_OPTS);
}
