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

export function optionalNumber(raw: unknown) {
  if (raw == null) return Number.NaN;
  if (typeof raw === "string" && raw.trim() === "") return Number.NaN;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : Number.NaN;
}

export function pickEnum<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function convertDisplayWeight(value: number, from: "lb" | "kg", to: "lb" | "kg") {
  if (from === to) return value;
  return kgToDisplay(displayToKg(value, from), to);
}

export function convertDisplayHeight(value: number, from: "lb" | "kg", to: "lb" | "kg") {
  if (from === to) return value;
  const cm = from === "lb" ? value * 2.54 : value;
  return to === "lb" ? Math.round((cm / 2.54) * 10) / 10 : Math.round(cm * 10) / 10;
}

export function formString(formData: FormData, key: string) {
  return String(formData.get(key) || "");
}

export function formatRest(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** Plausible adult ranges. Outside them the value is treated as a typo and ignored. */
export const WEIGHT_KG_RANGE = { min: 25, max: 400 } as const;
export const HEIGHT_CM_RANGE = { min: 100, max: 250 } as const;

export function displayWeightToKg(value: number, units: "lb" | "kg") {
  if (!Number.isFinite(value) || value <= 0) return null;
  const kg = displayToKg(value, units);
  return kg >= WEIGHT_KG_RANGE.min && kg <= WEIGHT_KG_RANGE.max ? kg : null;
}

export function displayHeightToCm(value: number, units: "lb" | "kg") {
  if (!Number.isFinite(value) || value <= 0) return null;
  const cm = units === "lb" ? value * 2.54 : value;
  return cm >= HEIGHT_CM_RANGE.min && cm <= HEIGHT_CM_RANGE.max ? cm : null;
}

export function optionalCheckinInt(
  raw: FormDataEntryValue | null,
  fallback: number | null,
  min: number,
  max: number,
) {
  if (raw === "" || raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? clampInt(n, fallback ?? min, min, max) : null;
}
