"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ACCENTS, AVATARS, FONTS, PALETTES, TYPE_SIZES, type LookPrefs } from "@/lib/look";
import { setPrefCookies } from "@/lib/prefs";

function pick<T extends string>(value: string, allowed: readonly { id: T }[], fallback: T): T {
  return allowed.some((item) => item.id === value) ? (value as T) : fallback;
}

export async function saveLookAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const look: LookPrefs = {
    palette: pick(String(formData.get("palette") || ""), PALETTES, "copper"),
    size: pick(String(formData.get("size") || ""), TYPE_SIZES, "md"),
    font: pick(String(formData.get("font") || ""), FONTS, "outfit"),
    accent: pick(String(formData.get("accent") || ""), ACCENTS, "none"),
    avatar: AVATARS.some((a) => a.id === String(formData.get("avatar") || ""))
      ? String(formData.get("avatar"))
      : "peach",
  };
  const theme = String(formData.get("theme") || "") === "light" ? "light" : "dark";
  await setPrefCookies(undefined, theme, look);
  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings?toast=look");
}
