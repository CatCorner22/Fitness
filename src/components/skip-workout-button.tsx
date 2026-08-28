"use client";

import { useState, useTransition } from "react";

export function SkipWorkoutButton({
  dayId,
  dayName,
  programId,
  week,
  skipAction,
}: {
  dayId: string;
  dayName: string;
  programId: string;
  week: number;
  skipAction: (dayId: string, dayName: string, programId: string, week: number) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button className="btn-quiet w-full" type="button" onClick={() => setConfirming(true)}>
        Not today
      </button>
    );
  }

  return (
    <form
      action={() => {
        startTransition(async () => {
          await skipAction(dayId, dayName, programId, week);
        });
      }}
      className="flex flex-wrap items-center justify-center gap-3"
    >
      <button className="rounded-2xl border border-line px-4 py-2 text-sm" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Rest today"}
      </button>
      <button className="btn-quiet" type="button" onClick={() => setConfirming(false)} disabled={pending}>
        Keep the workout
      </button>
    </form>
  );
}
