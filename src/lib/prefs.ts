import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOOK, parseLook, type LookPrefs } from "@/lib/look";
import { cookiePolicy } from "@/lib/runtime";

const AI_COOKIE = "garanimal_ai";
const THEME_COOKIE = "garanimal_theme";
const LOOK_COOKIE = "garanimal_look";

function prefCookieOpts() {
  const policy = cookiePolicy();
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: policy.sameSite,
    secure: policy.secure,
  };
}

export const getAiOptIn = cache(async () => {
  return (await cookies()).get(AI_COOKIE)?.value === "1";
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
) {
  const jar = await cookies();
  const opts = prefCookieOpts();
  if (aiOptIn !== undefined) {
    jar.set(AI_COOKIE, aiOptIn ? "1" : "0", opts);
  }
  jar.set(THEME_COOKIE, theme, opts);
  if (look) {
    jar.set(LOOK_COOKIE, JSON.stringify(look), opts);
  }
}
