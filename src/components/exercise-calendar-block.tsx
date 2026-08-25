import { ExerciseCalendar } from "@/components/exercise-calendar";
import { addDaysISO, CALENDAR_EPOCH, fillMapRange, loadCalendarState } from "@/lib/calendar";
import { todayISO } from "@/lib/utils";

export function ExerciseCalendarBlock({ userId }: { userId: string }) {
  const today = todayISO();
  const [year, month] = today.split("-").map(Number);
  const state = loadCalendarState(userId, today);
  const fills = fillMapRange("2026-08-01", addDaysISO(today, 40), state);
  return (
    <div className="mt-6">
      <ExerciseCalendar today={today} fills={fills} initialYear={year} initialMonth={month - 1} epoch={CALENDAR_EPOCH} />
    </div>
  );
}
