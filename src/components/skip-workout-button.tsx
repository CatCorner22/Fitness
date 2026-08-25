"use client";

import { useState } from "react";

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

  if (!confirming) {
    return (
      <button className="btn-quiet w-full" type="button" onClick={() => setConfirming(true)}>
        Not today
      </button>
    );
  }

  return (
    <form
      action={async () => {
        await skipAction(dayId, dayName, programId, week);
      }}
      className="flex flex-wrap items-center justify-center gap-3"
    >
      <button className="rounded-2xl border border-line px-4 py-2 text-sm" type="submit">
        Rest today
      </button>
      <button className="btn-quiet" type="button" onClick={() => setConfirming(false)}>
        Keep the workout
      </button>
    </form>
  );
}
