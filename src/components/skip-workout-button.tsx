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
      <button
        className="rounded-2xl border border-line px-5 py-3 text-muted"
        type="button"
        onClick={() => setConfirming(true)}
      >
        Skip today
      </button>
    );
  }

  return (
    <form
      action={async () => {
        await skipAction(dayId, dayName, programId, week);
      }}
      className="flex flex-wrap gap-2"
    >
      <button className="rounded-2xl border border-danger px-5 py-3 text-danger" type="submit">
        Confirm skip
      </button>
      <button
        className="rounded-2xl border border-line px-5 py-3 text-muted"
        type="button"
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
    </form>
  );
}
