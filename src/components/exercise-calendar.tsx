"use client";

import { useMemo, useState } from "react";
import { setTodayCalendarFillAction, toggleTodayCalendarAction } from "@/app/actions/calendar";
import { daysInMonth, mondayIndex, monthStartISO, type CalendarFill } from "@/lib/calendar-core";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function fillClass(fill: CalendarFill, isToday: boolean) {
  const ring = isToday ? " ring-2 ring-copper ring-offset-2 ring-offset-surface" : "";
  if (fill === "green") return `calendar-day calendar-day-green${ring}`;
  if (fill === "red") return `calendar-day calendar-day-red${ring}`;
  return `calendar-day calendar-day-gray${ring}`;
}

export function ExerciseCalendar({
  today,
  fills,
  initialYear,
  initialMonth,
  epoch,
}: {
  today: string;
  fills: Record<string, CalendarFill>;
  initialYear: number;
  initialMonth: number;
  epoch: string;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const todayFill = fills[today] ?? "red";

  const cells = useMemo(() => {
    const start = monthStartISO(year, month);
    const lead = mondayIndex(start);
    const count = daysInMonth(year, month);
    const blanks = Array.from({ length: lead }, (_, i) => ({ key: `b${i}`, date: null as string | null, day: 0 }));
    const days = Array.from({ length: count }, (_, i) => {
      const day = i + 1;
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { key: date, date, day };
    });
    return [...blanks, ...days];
  }, [year, month]);

  const thisMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const prevAllowed = thisMonth > "2026-08";
  const nextMonth = addMonths(thisMonth, 1);
  const canNext = nextMonth <= addMonths(today.slice(0, 7), 1);

  function shift(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    const next = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (next < "2026-08") return;
    if (next > addMonths(today.slice(0, 7), 1)) return;
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }

  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn-quiet px-3" onClick={() => shift(-1)} disabled={!prevAllowed} aria-label="Previous month">
          ←
        </button>
        <h2 className="display text-2xl">
          {MONTHS[month]} {year}
        </h2>
        <button type="button" className="btn-quiet px-3" onClick={() => shift(1)} disabled={!canNext} aria-label="Next month">
          →
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">
        Green is a training day. Red is a rest or miss. Future days and anything before {formatEpoch(epoch)} stay gray.
      </p>
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell) => {
          if (!cell.date) return <div key={cell.key} />;
          const fill = fills[cell.date] ?? (cell.date > today || cell.date < epoch ? "gray" : "red");
          const isToday = cell.date === today;
          const label = fillLabel(fill, isToday);
          if (isToday && today >= epoch) {
            return (
              <form key={cell.date} action={toggleTodayCalendarAction} className="contents">
                <input type="hidden" name="date" value={today} />
                <button
                  type="submit"
                  className={fillClass(fill, true)}
                  aria-label={`${cell.day}, today, ${label}. Tap to change.`}
                >
                  {cell.day}
                </button>
              </form>
            );
          }
          return (
            <div key={cell.date} className={fillClass(fill, false)} aria-label={`${cell.day}, ${label}`}>
              {cell.day}
            </div>
          );
        })}
      </div>
      {today >= epoch ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <form action={setTodayCalendarFillAction}>
            <input type="hidden" name="date" value={today} />
            <input type="hidden" name="fill" value="did" />
            <button type="submit" className={`w-full rounded-2xl border px-3 py-3 text-sm ${todayFill === "green" ? "border-moss bg-moss/20 text-ink" : "border-line text-muted"}`}>
              I trained
            </button>
          </form>
          <form action={setTodayCalendarFillAction}>
            <input type="hidden" name="date" value={today} />
            <input type="hidden" name="fill" value="skipped" />
            <button type="submit" className={`w-full rounded-2xl border px-3 py-3 text-sm ${todayFill === "red" ? "border-danger bg-danger/20 text-ink" : "border-line text-muted"}`}>
              I didn&apos;t
            </button>
          </form>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-muted">Today you can change the fill. Past days follow the log. Future stays gray.</p>
    </section>
  );
}

function fillLabel(fill: CalendarFill, isToday: boolean) {
  if (fill === "green") return isToday ? "trained, tap to mark rest" : "trained";
  if (fill === "red") return isToday ? "no session, tap to mark trained" : "no session";
  return "locked";
}

function formatEpoch(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
