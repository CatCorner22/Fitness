/** This week's programmed days, capped to the household days-per-week setting. */
export function scheduledProgramDays<T>(days: readonly T[], daysPerWeek: number): T[] {
  const n = Math.min(days.length, Math.max(1, Math.round(Number(daysPerWeek)) || 1));
  return days.slice(0, n);
}
