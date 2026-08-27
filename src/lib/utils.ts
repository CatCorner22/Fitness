import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function yesterdayISO(date = new Date()) {
  return daysAgoISO(1, date);
}

export function daysAgoISO(n: number, date = new Date()) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() - n);
  return todayISO(d);
}

export function epley1RM(weight: number, reps: number) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function kgToDisplay(kg: number, units: "lb" | "kg") {
  if (units === "kg") return Math.round(kg * 10) / 10;
  return Math.round(kg * 2.20462 * 2) / 2;
}

export function displayToKg(value: number, units: "lb" | "kg") {
  if (units === "kg") return value;
  return value / 2.20462;
}

export function formatWeight(kg: number, units: "lb" | "kg") {
  const n = kgToDisplay(kg, units);
  return `${n} ${units}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function clampInt(raw: unknown, fallback: number, min: number, max: number) {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(clamp(n, min, max));
}

export function pickEnum<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}