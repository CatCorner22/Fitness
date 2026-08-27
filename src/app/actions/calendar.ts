"use server";

import { requireUser } from "@/lib/auth";
import { loadCalendarState, upsertCalendarMark } from "@/lib/calendar";
import { CALENDAR_EPOCH, resolveFill } from "@/lib/calendar-core";
import { revalidateCalendar } from "@/lib/revalidate";
import { formString, todayISO } from "@/lib/utils";

function assertEditableToday(formDate: string, today: string) {
  return formDate !== today || today < CALENDAR_EPOCH;
}

export async function setTodayCalendarFillAction(formData: FormData) {
  const user = await requireUser();
  const today = todayISO();
  const requested = formString(formData, "fill");
  if (requested !== "did" && requested !== "skipped") return;
  if (assertEditableToday(formString(formData, "date") || today, today)) return;
  upsertCalendarMark(user.id, today, requested);
  revalidateCalendar();
}

export async function toggleTodayCalendarAction(formData: FormData) {
  const user = await requireUser();
  const today = todayISO();
  if (assertEditableToday(formString(formData, "date") || today, today)) return;
  const state = loadCalendarState(user.id, today);
  const current = resolveFill({ date: today, ...state });
  upsertCalendarMark(user.id, today, current === "green" ? "skipped" : "did");
  revalidateCalendar();
}
