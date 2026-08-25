/** Days before this date stay gray. The log starts here. */
export const CALENDAR_EPOCH = "2026-08-23";

export type CalendarFill = "green" | "red" | "gray";
export type CalendarMarkFill = "did" | "skipped";

export function compareISO(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthStartISO(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Monday-first weekday, 0 = Monday. */
export function mondayIndex(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (utcDay + 6) % 7;
}

export function resolveFill(options: {
  date: string;
  today: string;
  completedDates: Set<string>;
  marks: Record<string, CalendarMarkFill>;
}): CalendarFill {
  const { date, today, completedDates, marks } = options;
  if (compareISO(date, CALENDAR_EPOCH) < 0) return "gray";
  if (compareISO(date, today) > 0) return "gray";
  const mark = marks[date];
  if (mark === "did") return "green";
  if (mark === "skipped") return "red";
  if (completedDates.has(date)) return "green";
  return "red";
}
