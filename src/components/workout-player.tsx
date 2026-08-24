"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { completeWorkoutAction, logSetAction, swapExerciseAction } from "@/app/actions/workout";
import { PlateCalc } from "@/components/plate-calc";
import type { Exercise } from "@/lib/types";
import { kgToDisplay } from "@/lib/utils";

type SetRow = {
  id: string;
  exerciseId: string;
  setIndex: number;
  targetReps: string | null;
  targetRpe: number | null;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  completed: number;
};

export function WorkoutPlayer({
  workoutId,
  dayName,
  week,
  phase,
  units,
  sets,
  exercises,
  swaps,
  estimatedMinutes,
  decisions,
}: {
  workoutId: string;
  dayName: string;
  week: number;
  phase: string;
  units: "lb" | "kg";
  sets: SetRow[];
  exercises: Record<string, Exercise>;
  swaps: Record<string, Exercise[]>;
  estimatedMinutes: number;
  decisions: { exerciseId: string; reason: string }[];
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, SetRow[]>();
    for (const set of sets) {
      const list = map.get(set.exerciseId) ?? [];
      list.push(set);
      map.set(set.exerciseId, list);
    }
    return [...map.entries()];
  }, [sets]);

  const [active, setActive] = useState<string | null>(grouped[0]?.[0] ?? null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [started] = useState(() => Date.now());
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function startRest(rest: number) {
    setSeconds(rest);
    setRunning(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-copper">Live session</p>
          <h1 className="display text-4xl">{dayName}</h1>
          <p className="text-muted">
            Week {week} · {phase} · budget ~{estimatedMinutes} min
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-3 text-center">
          <p className="text-xs uppercase text-muted">Rest</p>
          <p className="display text-4xl tabular-nums">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </p>
          <div className="mt-2 flex gap-2 text-xs">
            <button type="button" onClick={() => startRest(90)} className="text-copper-2">
              1:30
            </button>
            <button type="button" onClick={() => startRest(180)} className="text-copper-2">
              3:00
            </button>
            <button type="button" onClick={() => setRunning(false)} className="text-muted">
              pause
            </button>
          </div>
        </div>
      </div>
      <PlateCalc units={units} />

      {grouped.map(([exerciseId, rows]) => {
        const ex = exercises[exerciseId];
        const decision = decisions.find((d) => d.exerciseId === exerciseId);
        return (
          <section key={exerciseId} className="rounded-3xl border border-line bg-surface p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{ex?.name ?? exerciseId}</h2>
                <p className="text-xs text-muted">
                  {rows[0]?.targetReps} @ RPE {rows[0]?.targetRpe}
                  {ex?.safety === "caution" ? ` · Caution: ${ex.safetyNote}` : ""}
                </p>
                {decision && <p className="mt-2 text-xs text-copper-2">{decision.reason}</p>}
              </div>
              {swaps[exerciseId]?.length ? (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted">Swap</summary>
                  <div className="mt-2 space-y-1">
                    {swaps[exerciseId].map((alt) => (
                      <form key={alt.id} action={swapExerciseAction}>
                        <input type="hidden" name="workoutId" value={workoutId} />
                        <input type="hidden" name="fromId" value={exerciseId} />
                        <input type="hidden" name="toId" value={alt.id} />
                        <button className="text-copper-2" type="submit">
                          {alt.name}
                        </button>
                      </form>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              {rows.map((set) => (
                <form
                  key={set.id}
                  action={(fd) => {
                    startTransition(() => logSetAction(fd));
                    startRest(ex?.restSeconds ?? 90);
                    setActive(set.id);
                  }}
                  className="grid grid-cols-12 items-end gap-2 rounded-2xl bg-bg-2 p-3"
                >
                  <input type="hidden" name="setId" value={set.id} />
                  <p className="col-span-1 text-sm text-muted">{set.setIndex + 1}</p>
                  <label className="col-span-3 text-xs text-muted">
                    Weight
                    <input
                      name="weight"
                      type="number"
                      step="0.5"
                      defaultValue={set.weightKg != null ? kgToDisplay(set.weightKg, units) : ""}
                      className="mt-1 py-2"
                    />
                  </label>
                  <label className="col-span-3 text-xs text-muted">
                    Reps
                    <input
                      name="reps"
                      type="number"
                      defaultValue={set.reps ?? ""}
                      className="mt-1 py-2"
                    />
                  </label>
                  <label className="col-span-3 text-xs text-muted">
                    RPE
                    <input
                      name="rpe"
                      type="number"
                      min={5}
                      max={10}
                      step="0.5"
                      defaultValue={set.rpe ?? set.targetRpe ?? 8}
                      className="mt-1 py-2"
                    />
                  </label>
                  <button
                    className={`col-span-2 rounded-xl py-2 text-sm ${
                      set.completed ? "bg-moss text-bg" : "bg-copper text-bg"
                    }`}
                    type="submit"
                  >
                    {set.completed ? "✓" : "Log"}
                  </button>
                </form>
              ))}
            </div>
          </section>
        );
      })}

      <form action={completeWorkoutAction} className="rounded-3xl border border-line bg-surface p-6">
        <input type="hidden" name="workoutId" value={workoutId} />
        <h2 className="text-xl">Finish</h2>
        <p className="text-sm text-muted">Session RPE is how hard the whole workout felt, 0–10. Not a set RIR.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-muted">
            Session RPE
            <input name="sessionRpe" type="number" min={0} max={10} step="0.5" defaultValue={7} className="mt-1" />
          </label>
          <label className="text-sm text-muted">
            Actual minutes
            <input
              name="durationMinutes"
              type="number"
              defaultValue={Math.max(1, Math.round((Date.now() - started) / 60000) || estimatedMinutes)}
              className="mt-1"
            />
          </label>
        </div>
        <label className="mt-3 block text-sm text-muted">
          Notes
          <textarea name="notes" rows={2} className="mt-1" />
        </label>
        <button className="mt-4 w-full rounded-2xl bg-copper py-3 font-semibold text-bg" type="submit">
          Save session
        </button>
        {active ? null : null}
      </form>
    </div>
  );
}