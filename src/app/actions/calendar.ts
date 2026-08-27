"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { loadCalendarState, upsertCalendarMark } from "@/lib/calendar";
import { CALENDAR_EPOCH, resolveFill } from "@/lib/calendar-core";
import { todayISO } from "@/lib/utils";

export async function setTodayCalendarFillAction(formData: FormData) {
  const user = await requireUser();
  const today = todayISO();
  const requested = String(formData.get("fill") || "");
  if (requested !== "did" && requested !== "skipped") return;
  if (compareTodayOnly(String(formData.get("date") || today), today)) return;
  upsertCalendarMark(user.id, today, requested);
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function toggleTodayCalendarAction(formData: FormData) {
  const user = await requireUser();
  const today = todayISO();
  if (compareTodayOnly(String(formData.get("date") || today), today)) return;
  const state = loadCalendarState(user.id, today);
  const current = resolveFill({ date: today, ...state });
  upsertCalendarMark(user.id, today, current === "green" ? "skipped" : "did");
  revalidatePath("/");
  revalidatePath("/progress");
}

function compareTodayOnly(date: string, today: string) {
  return date !== today || today < CALENDAR_EPOCH;
}
