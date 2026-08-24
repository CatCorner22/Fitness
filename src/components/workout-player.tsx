"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { completeWorkoutAction, swapExerciseAction } from "@/app/actions/workout";
import { PlateCalc } from "@/components/plate-calc";
import { SpiritAdvisor, type SpiritAdvicePanel } from "@/components/spirit-advisor";
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

type LiveAdvice = SpiritAdvicePanel;

type GhostSet = { weightKg: number; reps: number; rpe: number | null };

function playRestBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    window.setTimeout(() => ctx.close(), 300);
  } catch {
    /* audio unavailable */
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([120, 60, 120]);
  }
}

export function WorkoutPlayer({
  workoutId,
  dayName,
  week,
  phase,
  units,
  sets: initialSets,
  exercises,
  swaps,
  estimatedMinutes,
  decisions,
  aiAvailable,
  ghostSets,
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
  aiAvailable: boolean;
  ghostSets: Record<string, GhostSet>;
}) {
  const [sets, setSets] = useState(initialSets);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const grouped = useMemo(() => {
    const map = new Map<string, SetRow[]>();
    for (const set of sets) {
      const list = map.get(set.exerciseId) ?? [];
      list.push(set);
      map.set(set.exerciseId, list);
    }
    return [...map.entries()];
  }, [sets]);

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const alertedRef = useRef(false);
  const [started] = useState(() => Date.now());
  const [spiritAdvice, setSpiritAdvice] = useState<LiveAdvice | null>(null);
  const [spiritLoading, setSpiritLoading] = useState(false);
  const [lastExerciseId, setLastExerciseId] = useState<string | null>(null);
  const [loadHints, setLoadHints] = useState<Record<string, number>>({});

  const completedCount = sets.filter((s) => s.completed).length;

  useEffect(() => {
    if (!running || seconds <= 0) return;
    alertedRef.current = false;
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          if (!alertedRef.current) {
            alertedRef.current = true;
            playRestBeep();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, seconds]);

  function startRest(rest: number) {
    alertedRef.current = false;
    setSeconds(rest);
    setRunning(true);
  }

  const logSet = useCallback(
    async (set: SetRow, form: HTMLFormElement) => {
      const fd = new FormData(form);
      const weight = Number(fd.get("weight"));
      const reps = Number(fd.get("reps"));
      const rpe = Number(fd.get("rpe"));
      const elapsedMinutes = Math.max(1, Math.round((Date.now() - started) / 60000));
      const doneGroups = new Set(
        sets.filter((s) => s.completed || s.id === set.id).map((s) => s.exerciseId),
      );
      const remainingExercises = grouped.length - doneGroups.size;

      setSpiritLoading(true);
      startRest(90);
      setSpiritAdvice({
        message: "*tail swish* Crunching your set...",
        restSeconds: 90,
        nextAction: "repeat_load",
        weightDeltaKg: null,
        swapToExerciseId: null,
        mood: "thinking",
        citeIds: [],
      });

      try {
        const res = await fetch("/api/workout/log-set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            setId: set.id,
            weight,
            reps,
            rpe,
            elapsedMinutes,
            remainingExercises,
          }),
        });
        if (!res.ok) throw new Error("log failed");
        const data = await res.json();
        setSpiritAdvice(data.advice);
        startRest(data.advice.restSeconds);
        setLastExerciseId(set.exerciseId);
        setEditingSetId(null);
        const nextSet = sets.find(
          (s) => s.exerciseId === set.exerciseId && s.setIndex === set.setIndex + 1,
        );
        if (nextSet && data.advice.weightDeltaKg != null && Number.isFinite(weight)) {
          const baseKg = units === "lb" ? weight / 2.20462 : weight;
          const hinted = kgToDisplay(baseKg + data.advice.weightDeltaKg, units);
          setLoadHints((prev) => ({ ...prev, [nextSet.id]: hinted }));
        }
        setSets((prev) =>
          prev.map((s) =>
            s.id === set.id
              ? {
                  ...s,
                  completed: 1,
                  weightKg: Number.isFinite(weight) ? (units === "lb" ? weight / 2.20462 : weight) : s.weightKg,
                  reps: Number.isFinite(reps) ? reps : s.reps,
                  rpe: Number.isFinite(rpe) ? rpe : s.rpe,
                }
              : s,
          ),
        );
      } catch {
        setSpiritAdvice({
          message: "Signal lost on the mountain — logged locally? Try again. Default 90s rest, nya~",
          restSeconds: 90,
          nextAction: "repeat_load",
          weightDeltaKg: null,
          swapToExerciseId: null,
          mood: "caution",
          citeIds: [],
          source: "rules",
        });
        startRest(90);
      } finally {
        setSpiritLoading(false);
      }
    },
    [grouped.length, sets, started, units],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-copper">Live session</p>
          <h1 className="display text-4xl">{dayName}</h1>
          <p className="text-muted">
            Week {week} · {phase} · budget ~{estimatedMinutes} min · {completedCount}/{sets.length} sets
          </p>
        </div>
        <div
          className={`rounded-2xl border bg-surface px-5 py-3 text-center transition-colors ${
            running && seconds <= 10 ? "border-copper animate-pulse" : "border-line"
          }`}
        >
          <p className="text-xs uppercase text-muted">Rest</p>
          <p className={`display text-4xl tabular-nums ${running && seconds <= 10 ? "text-copper-2" : ""}`}>
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

      <SpiritAdvisor
        advice={spiritAdvice}
        loading={spiritLoading}
        aiAvailable={aiAvailable}
        units={units}
        kgToDisplay={kgToDisplay}
        swapButton={
          spiritAdvice?.swapToExerciseId && lastExerciseId ? (
            <form action={swapExerciseAction} className="mt-2">
              <input type="hidden" name="workoutId" value={workoutId} />
              <input type="hidden" name="fromId" value={lastExerciseId} />
              <input type="hidden" name="toId" value={spiritAdvice.swapToExerciseId} />
              <button type="submit" className="text-sm text-copper-2 underline-offset-2 hover:underline">
                Apply Spirit&apos;s swap →{" "}
                {exercises[spiritAdvice.swapToExerciseId]?.name ?? spiritAdvice.swapToExerciseId}
              </button>
            </form>
          ) : null
        }
      />

      <PlateCalc units={units} />

      {grouped.map(([exerciseId, rows]) => {
        const ex = exercises[exerciseId];
        const decision = decisions.find((d) => d.exerciseId === exerciseId);
        const ghost = ghostSets[exerciseId];
        return (
          <section key={exerciseId} className="rounded-3xl border border-line bg-surface p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{ex?.name ?? exerciseId}</h2>
                <p className="text-xs text-muted">
                  {rows[0]?.targetReps} @ RPE {rows[0]?.targetRpe}
                  {ex?.safety === "caution" ? ` · Caution: ${ex.safetyNote}` : ""}
                </p>
                {ghost && (
                  <p className="mt-1 text-xs text-muted/80">
                    Last: {kgToDisplay(ghost.weightKg, units)} {units} × {ghost.reps}
                    {ghost.rpe != null ? ` @ RPE ${ghost.rpe}` : ""}
                  </p>
                )}
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
              {rows.map((set) => {
                const isDone = Boolean(set.completed) && editingSetId !== set.id;
                return (
                  <form
                    key={set.id}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (isDone) return;
                      logSet(set, e.currentTarget);
                    }}
                    className={`grid grid-cols-12 items-end gap-2 rounded-2xl p-3 ${
                      isDone ? "bg-moss/10" : "bg-bg-2"
                    }`}
                  >
                    <p className="col-span-1 text-sm text-muted">{set.setIndex + 1}</p>
                    <label className="col-span-3 text-xs text-muted">
                      Weight
                      <input
                        name="weight"
                        type="number"
                        step="0.5"
                        disabled={isDone}
                        defaultValue={
                          loadHints[set.id] ??
                          (set.weightKg != null ? kgToDisplay(set.weightKg, units) : "")
                        }
                        className="mt-1 py-2 disabled:opacity-60"
                      />
                    </label>
                    <label className="col-span-3 text-xs text-muted">
                      Reps
                      <input
                        name="reps"
                        type="number"
                        disabled={isDone}
                        defaultValue={set.reps ?? ""}
                        className="mt-1 py-2 disabled:opacity-60"
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
                        disabled={isDone}
                        defaultValue={set.rpe ?? set.targetRpe ?? 8}
                        className="mt-1 py-2 disabled:opacity-60"
                      />
                    </label>
                    {isDone ? (
                      <button
                        className="col-span-2 rounded-xl bg-moss/20 py-2 text-sm text-moss"
                        type="button"
                        onClick={() => setEditingSetId(set.id)}
                      >
                        ✓
                      </button>
                    ) : (
                      <button
                        className="col-span-2 rounded-xl bg-copper py-2 text-sm text-bg"
                        type="submit"
                        disabled={spiritLoading}
                      >
                        Log
                      </button>
                    )}
                  </form>
                );
              })}
            </div>
          </section>
        );
      })}

      <form action={completeWorkoutAction} className="rounded-3xl border border-line bg-surface p-6">
        <input type="hidden" name="workoutId" value={workoutId} />
        <h2 className="text-xl">Finish</h2>
        <p className="text-sm text-muted">Session RPE is how hard the whole workout felt, 0–10.</p>
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
      </form>
    </div>
  );
}
