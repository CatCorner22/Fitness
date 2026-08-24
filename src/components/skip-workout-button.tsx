"use client";

import { useRef, useState } from "react";

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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async () => {
        await skipAction(dayId, dayName, programId, week);
      }}
      onSubmit={(e) => {
        if (!confirming) {
          e.preventDefault();
          setConfirming(true);
        }
      }}
    >
      <button
        className={`rounded-2xl border px-5 py-3 ${
          confirming ? "border-danger text-danger" : "border-line text-muted"
        }`}
        type="submit"
        onBlur={() => window.setTimeout(() => setConfirming(false), 150)}
      >
        {confirming ? "Tap again to skip" : "Skip today"}
      </button>
    </form>
  );
}
