"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ACCENTS, AVATARS, FONTS, PALETTES, TYPE_SIZES, type LookPrefs } from "@/lib/look";
import { formString } from "@/lib/utils";
import { setPrefCookies } from "@/lib/prefs";

function pick<T extends string>(value: string, allowed: readonly { id: T }[], fallback: T): T {
  return allowed.some((item) => item.id === value) ? (value as T) : fallback;
}

export async function saveLookAction(formData: FormData) {
  await requireUser();
  const look: LookPrefs = {
    palette: pick(formString(formData, "palette"), PALETTES, "copper"),
    size: pick(formString(formData, "size"), TYPE_SIZES, "md"),
    font: pick(formString(formData, "font"), FONTS, "outfit"),
    accent: pick(formString(formData, "accent"), ACCENTS, "none"),
    avatar: pick(formString(formData, "avatar"), AVATARS, "peach"),
  };
  const theme = formString(formData, "theme") === "light" ? "light" : "dark";
  await setPrefCookies(undefined, theme, look);
  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings?toast=look");
}
