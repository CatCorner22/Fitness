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