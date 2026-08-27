"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { completeWorkoutAction, swapExerciseAction } from "@/app/actions/workout";
import { PlateCalc } from "@/components/plate-calc";
import { SpiritAdvisor, type SpiritAdvicePanel } from "@/components/spirit-advisor";
import { hardnessToRpe, parseRepTarget } from "@/lib/copy";
import { lessonForExercise } from "@/lib/course/skills";
import { restAfterLoggedSet } from "@/lib/rest";
import type { Exercise } from "@/lib/types";
import { displayToKg, formatRest, kgToDisplay } from "@/lib/utils";

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

type GhostSet = { weightKg: number; reps: number; rpe: number | null };

const HARDNESS = [
  ["easy", "Easy"],
  ["ok", "OK"],
  ["hard", "Hard"],
] as const;

const REST_MUTE_KEY = "garanimal_rest_mute";
const muteListeners = new Set<() => void>();

function restMuteSnapshot() {
  try {
    return localStorage.getItem(REST_MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeRestMute(onStoreChange: () => void) {
  muteListeners.add(onStoreChange);
  return () => {
    muteListeners.delete(onStoreChange);
  };
}

function setRestMute(next: boolean) {
  try {
    localStorage.setItem(REST_MUTE_KEY, next ? "1" : "0");
  } catch {
    /* private mode */
  }
  for (const listener of muteListeners) listener();
}

function restAlertsAllowed() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (restMuteSnapshot()) return false;
  } catch {
    /* private mode / SSR */
  }
  return true;
}

function playRestBeep() {
  if (!restAlertsAllowed()) return;
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

function HardnessButtons({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex gap-2" role="group">
      {HARDNESS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          aria-label={`${label} (about RPE ${hardnessToRpe(id)})`}
          onClick={() => onChange(value === id ? "" : id)}
          className={`min-h-11 flex-1 rounded-xl border px-2 text-sm ${
            value === id ? "border-copper bg-copper/15 text-copper-2" : "border-line text-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function WorkoutPlayer({
  workoutId,
  dayName,
  units,
  sets: initialSets,
  exercises,
  swaps,
  estimatedMinutes,
  decisions,
  aiAvailable,
  aiOptIn,
  ghostSets,
  courseId,
  courseSkillIds,
  restMultiplier = 1,
}: {
  workoutId: string;
  dayName: string;
  units: "lb" | "kg";
  sets: SetRow[];
  exercises: Record<string, Exercise>;
  swaps: Record<string, Exercise[]>;
  estimatedMinutes: number;
  decisions: { exerciseId: string; reason: string }[];
  aiAvailable: boolean;
  aiOptIn: boolean;
  ghostSets: Record<string, GhostSet>;
  courseId?: string;
  courseSkillIds?: string[];
  /** Session-level rest scaling from the fitness assessment / energy check-in. */
  restMultiplier?: number;
}) {
  const [sets, setSets] = useState(initialSets);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [hardness, setHardness] = useState<Record<string, string>>({});
  const [sessionFeel, setSessionFeel] = useState("");
  const [logError, setLogError] = useState<string | null>(null);
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
  // Deadline timestamp instead of a decrementing counter: browsers throttle
  // intervals in background tabs / locked phones, which froze the countdown.
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);
  const muteAlerts = useSyncExternalStore(subscribeRestMute, restMuteSnapshot, () => false);
  const resting = restEndsAt != null || pausedRemaining != null;
  const paused = pausedRemaining != null;
  const alertedRef = useRef(false);
  const loggingRef = useRef<string | null>(null);
  const [started] = useState(() => Date.now());
  const [spiritAdvice, setSpiritAdvice] = useState<SpiritAdvicePanel | null>(null);
  const [lastExerciseId, setLastExerciseId] = useState<string | null>(null);
  const [loadHints, setLoadHints] = useState<Record<string, number>>({});

  const completedCount = sets.filter((s) => s.completed).length;
  const current = grouped.find(([, rows]) => rows.some((s) => !s.completed)) ?? grouped[grouped.length - 1];
  const catalogRest = Math.round((current ? (exercises[current[0]]?.restSeconds ?? 90) : 90) * restMultiplier);
  const why = current ? decisions.find((d) => d.exerciseId === current[0]) : undefined;

  useEffect(() => {
    if (restEndsAt == null) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setSeconds(next);
      if (next === 0) {
        setRestEndsAt(null);
        if (!alertedRef.current) {
          alertedRef.current = true;
          playRestBeep();
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    // Resync immediately when the tab wakes from background throttling.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [restEndsAt]);

  // Keep the screen awake mid-workout; harmless no-op where unsupported.
  useEffect(() => {
    let active = true;
    let sentinel: WakeLockSentinel | null = null;
    const acquire = async () => {
      if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (!active) {
          void lock.release();
          return;
        }
        sentinel = lock;
      } catch {
        // Denied (e.g. battery saver) — screen dimming is acceptable.
      }
    };
    const onVisibility = () => void acquire();
    void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
    };
  }, []);

  function startRest(rest: number) {
    alertedRef.current = false;
    setPausedRemaining(null);
    setSeconds(rest);
    setRestEndsAt(Date.now() + rest * 1000);
  }

  function pauseRest() {
    if (restEndsAt == null) return;
    const remaining = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
    setRestEndsAt(null);
    setPausedRemaining(remaining);
    setSeconds(remaining);
  }

  function resumeRest() {
    if (pausedRemaining == null || pausedRemaining <= 0) {
      setPausedRemaining(null);
      return;
    }
    alertedRef.current = false;
    setRestEndsAt(Date.now() + pausedRemaining * 1000);
    setPausedRemaining(null);
  }

  function skipRest() {
    setRestEndsAt(null);
    setPausedRemaining(null);
    setSeconds(0);
  }

  function toggleMuteAlerts() {
    setRestMute(!muteAlerts);
  }

  function stampDuration(form: HTMLFormElement) {
    const minutes = Math.max(1, Math.round((Date.now() - started) / 60000) || estimatedMinutes);
    const field = form.elements.namedItem("durationMinutes");
    if (field instanceof HTMLInputElement) field.value = String(minutes);
  }

  const logSet = useCallback(
    async (set: SetRow, form: HTMLFormElement) => {
      if (loggingRef.current === set.id) return;
      loggingRef.current = set.id;
      const fd = new FormData(form);
      const weight = Number(fd.get("weight"));
      const reps = Number(fd.get("reps"));
      const rpe = hardnessToRpe(hardness[set.id] ?? "") ?? Number.NaN;
      const elapsedMinutes = Math.max(1, Math.round((Date.now() - started) / 60000));
      const doneGroups = new Set(
        sets.filter((s) => s.completed || s.id === set.id).map((s) => s.exerciseId),
      );
      const remainingExercises = grouped.length - doneGroups.size;

      setLogError(null);
      setEditingSetId(null);
      setSets((prev) =>
        prev.map((s) =>
          s.id === set.id
            ? {
                ...s,
                completed: 1,
                weightKg: Number.isFinite(weight) ? displayToKg(weight, units) : s.weightKg,
                reps: Number.isFinite(reps) ? reps : s.reps,
                rpe: Number.isFinite(rpe) ? rpe : null,
              }
            : s,
        ),
      );

      try {
        let res: Response | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            res = await fetch("/api/workout/log-set", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              redirect: "manual",
              body: JSON.stringify({
                setId: set.id,
                weight,
                reps,
                rpe: Number.isFinite(rpe) ? rpe : null,
                elapsedMinutes,
                remainingExercises,
              }),
            });
            if (res.ok || (res.status >= 400 && res.status < 500)) break;
          } catch {
            if (attempt === 1) throw new Error("log failed");
          }
        }
        if (!res?.ok) throw new Error("log failed");
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) throw new Error("log failed");
        setLastExerciseId(set.exerciseId);
        let adviceRest: number | null = null;
        try {
          const data = (await res.json()) as {
            advice?: { weightDeltaKg?: number | null; restSeconds?: number } & SpiritAdvicePanel;
          };
          if (data.advice) {
            if (aiOptIn) setSpiritAdvice(data.advice);
            if (data.advice.restSeconds != null) adviceRest = data.advice.restSeconds;
            const nextSet = sets.find(
              (s) => s.exerciseId === set.exerciseId && s.setIndex === set.setIndex + 1,
            );
            if (nextSet && data.advice.weightDeltaKg != null && Number.isFinite(weight)) {
              const baseKg = displayToKg(weight, units);
              const hinted = kgToDisplay(baseKg + data.advice.weightDeltaKg, units);
              setLoadHints((prev) => ({ ...prev, [nextSet.id]: hinted }));
            }
          }
        } catch {
          /* set is saved; advice is optional */
        }
        const moreSets = sets.some((s) => s.id !== set.id && !s.completed);
        const rest = restAfterLoggedSet({
          catalogRestSeconds: Math.round((exercises[set.exerciseId]?.restSeconds ?? 90) * restMultiplier),
          moreSetsRemain: moreSets,
          adviceRestSeconds: adviceRest,
          useAdvice: aiOptIn,
        });
        if (rest > 0) startRest(rest);
      } catch {
        setLogError("Could not save that set. Check the numbers and tap Log again.");
        setSets((prev) => prev.map((s) => (s.id === set.id ? { ...s, completed: 0 } : s)));
      } finally {
        if (loggingRef.current === set.id) loggingRef.current = null;
      }
    },
    [aiOptIn, exercises, grouped.length, hardness, restMultiplier, sets, started, units],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-4xl">{dayName}</h1>
        <p className="mt-1 text-muted">
          {completedCount}/{sets.length} sets
        </p>
      </div>

      <div
        className={`rounded-3xl border bg-surface px-5 py-4 text-center ${
          resting && !paused && seconds <= 10 ? "border-copper" : "border-line"
        }`}
      >
        <p className="text-sm text-muted">
          {paused ? "Rest paused" : resting ? "Rest" : "Rest starts after you log a set"}
        </p>
        <p
          className={`display mt-1 text-5xl tabular-nums ${resting && !paused && seconds <= 10 ? "text-copper-2" : ""}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {formatRest(seconds)}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {catalogRest > 0 && catalogRest !== 90 && catalogRest !== 180 ? (
            <button type="button" onClick={() => startRest(catalogRest)} className="min-h-11 rounded-xl border border-line px-4">
              {formatRest(catalogRest)}
            </button>
          ) : null}
          <button type="button" onClick={() => startRest(90)} className="min-h-11 rounded-xl border border-line px-4">
            1:30
          </button>
          <button type="button" onClick={() => startRest(180)} className="min-h-11 rounded-xl border border-line px-4">
            3:00
          </button>
          {restEndsAt != null ? (
            <button type="button" onClick={pauseRest} className="min-h-11 rounded-xl px-4 text-muted">
              Pause
            </button>
          ) : null}
          {paused ? (
            <button type="button" onClick={resumeRest} className="min-h-11 rounded-xl border border-line px-4">
              Resume
            </button>
          ) : null}
          {resting ? (
            <button type="button" onClick={skipRest} className="min-h-11 rounded-xl px-4 text-muted">
              Skip rest
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-pressed={muteAlerts}
          onClick={toggleMuteAlerts}
          className="mt-3 text-sm text-muted underline-offset-2 hover:underline"
        >
          {muteAlerts ? "Alerts muted" : "Mute beep and vibrate"}
        </button>
      </div>

      {logError ? <p className="text-sm text-danger">{logError}</p> : null}

      {aiOptIn ? (
        <SpiritAdvisor
          advice={spiritAdvice}
          loading={false}
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
                  Use suggested swap: {exercises[spiritAdvice.swapToExerciseId]?.name ?? spiritAdvice.swapToExerciseId}
                </button>
              </form>
            ) : null
          }
        />
      ) : null}

      {grouped.map(([exerciseId, rows]) => {
        const ex = exercises[exerciseId];
        const ghost = ghostSets[exerciseId];
        const isCurrent = current?.[0] === exerciseId;
        const doneHere = rows.filter((s) => s.completed).length;
        const lesson = lessonForExercise(exerciseId, { courseId, skillIds: courseSkillIds });
        if (!isCurrent) {
          return (
            <section key={exerciseId} className="rounded-3xl border border-line bg-surface px-4 py-3">
              <p className="font-semibold">{ex?.name ?? exerciseId}</p>
              <p className="text-sm text-muted">
                {doneHere}/{rows.length} sets · {rows[0]?.targetReps ?? "8"} @ RPE {rows[0]?.targetRpe ?? "—"}
              </p>
              {ex?.safetyNote ? <p className="mt-1 text-xs text-muted">{ex.safetyNote}</p> : null}
              {lesson ? (
                <Link href={lesson.href} className="mt-1 inline-block text-xs text-copper-2">
                  How: {lesson.skill.cue}
                </Link>
              ) : null}
            </section>
          );
        }
        return (
          <section
            key={exerciseId}
            className={`rounded-3xl border bg-surface p-4 ${isCurrent ? "border-copper/40" : "border-line"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{ex?.name ?? exerciseId}</h2>
                <p className="text-sm text-muted">
                  {rows.length} sets of {rows[0]?.targetReps ?? "8"}
                </p>
                {ghost ? (
                  <p className="mt-1 text-sm text-muted">
                    Last time: {kgToDisplay(ghost.weightKg, units)} {units} × {ghost.reps}
                  </p>
                ) : null}
                {why?.reason ? <p className="mt-1 text-sm text-muted">{why.reason}</p> : null}
                {ex?.safety === "caution" || ex?.safetyNote ? <p className="mt-1 text-sm text-muted">{ex.safetyNote}</p> : null}
                {lesson ? (
                  <Link href={lesson.href} className="mt-1 inline-block text-sm text-copper-2">
                    Nyx lesson — {lesson.skill.cue}
                  </Link>
                ) : null}
              </div>
              {swaps[exerciseId]?.length ? (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted">Swap lift</summary>
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
            <div className="mt-4 space-y-4">
              {rows.map((set) => {
                const isDone = Boolean(set.completed) && editingSetId !== set.id;
                const firstOpen = rows.find((s) => !s.completed || s.id === editingSetId);
                if (isDone) {
                  return (
                    <button
                      key={set.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl bg-moss/10 px-4 py-3 text-left text-sm"
                      onClick={() => setEditingSetId(set.id)}
                    >
                      <span>
                        Set {set.setIndex + 1} · {set.weightKg != null ? kgToDisplay(set.weightKg, units) : "—"} {units} ×{" "}
                        {set.reps ?? "—"}
                      </span>
                      <span className="text-moss">Done</span>
                    </button>
                  );
                }
                if (firstOpen && firstOpen.id !== set.id) {
                  return (
                    <p key={set.id} className="px-1 text-sm text-muted">
                      Set {set.setIndex + 1} waiting
                    </p>
                  );
                }
                const weightDefault =
                  loadHints[set.id] ??
                  (set.weightKg != null ? kgToDisplay(set.weightKg, units) : "");
                const repsDefault = set.reps ?? parseRepTarget(set.targetReps);
                return (
                  <form
                    key={set.id}
                    onSubmit={(e) => {
                      e.preventDefault();
                      logSet(set, e.currentTarget);
                    }}
                    className="space-y-3 rounded-2xl bg-bg-2 p-4"
                  >
                    <p className="text-sm text-muted">Set {set.setIndex + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm text-muted">
                        Weight ({units})
                        <input
                          name="weight"
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          defaultValue={weightDefault}
                          className="mt-1 min-h-12"
                        />
                      </label>
                      <label className="text-sm text-muted">
                        Reps
                        <input
                          name="reps"
                          type="number"
                          inputMode="numeric"
                          defaultValue={repsDefault}
                          className="mt-1 min-h-12"
                        />
                      </label>
                    </div>
                    <div>
                      <p className="mb-2 text-sm text-muted">How did that feel? Optional. Easy / OK / Hard maps to about RPE 6 / 7.5 / 9.</p>
                      <HardnessButtons
                        value={hardness[set.id] ?? ""}
                        onChange={(next) => setHardness((prev) => ({ ...prev, [set.id]: next }))}
                      />
                    </div>
                    <button className="btn-primary" type="submit">
                      Log set
                    </button>
                  </form>
                );
              })}
            </div>
          </section>
        );
      })}

      <details className="rounded-3xl border border-line bg-surface p-4 text-sm">
        <summary className="cursor-pointer text-muted">Plate math</summary>
        <div className="mt-3">
          <PlateCalc units={units} />
        </div>
      </details>

      <form
        action={completeWorkoutAction}
        className="space-y-4 rounded-3xl border border-line bg-surface p-5"
        onSubmit={(e) => stampDuration(e.currentTarget)}
      >
        <input type="hidden" name="workoutId" value={workoutId} />
        <input type="hidden" name="durationMinutes" defaultValue={estimatedMinutes} />
        <input type="hidden" name="sessionRpe" value={hardnessToRpe(sessionFeel) ?? ""} />
        <h2 className="text-lg font-semibold">Finish</h2>
        <p className="text-sm text-muted">How was the whole session? Optional.</p>
        <HardnessButtons value={sessionFeel} onChange={setSessionFeel} />
        <label className="block text-sm text-muted">
          Note
          <textarea name="notes" rows={2} className="mt-1" />
        </label>
        <button className="btn-primary" type="submit">
          Done
        </button>
      </form>
      <form
        action={completeWorkoutAction}
        className="text-center"
        onSubmit={(e) => stampDuration(e.currentTarget)}
      >
        <input type="hidden" name="workoutId" value={workoutId} />
        <input type="hidden" name="durationMinutes" defaultValue={estimatedMinutes} />
        <input type="hidden" name="stop" value="1" />
        <button className="btn-quiet w-full" type="submit">
          Stop — something hurts
        </button>
      </form>
    </div>
  );
}
