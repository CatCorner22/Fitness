"use client";

import { useSyncExternalStore } from "react";
import {
  adjustFastAction,
  endFastAction,
  nudgeFastAction,
  startFastAction,
} from "@/app/actions/fasting";
import {
  FAST_PROTOCOLS,
  formatDuration,
  formatElapsedLabel,
  isoToLocalInput,
} from "@/lib/fasting/protocols";

type FastRow = {
  id: string;
  protocol: string;
  targetMinutes: number;
  startedAt: string;
  plannedEndAt: string;
  endedAt: string | null;
  status: string;
  notes: string | null;
};

type AdjRow = {
  id: string;
  createdAt: string;
  kind: string;
  summary: string;
};

let tick = 0;

function subscribeNow(onStoreChange: () => void) {
  tick = Date.now();
  const id = window.setInterval(() => {
    tick = Date.now();
    onStoreChange();
  }, 1000);
  return () => window.clearInterval(id);
}

function nowMs() {
  if (!tick) tick = Date.now();
  return tick;
}

function serverNow() {
  return 0;
}

function formatClock(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FastingTimer({
  running,
  recent,
  adjustments,
  defaultStart,
}: {
  running: FastRow | null;
  recent: FastRow[];
  adjustments: AdjRow[];
  defaultStart: string;
}) {
  const now = useSyncExternalStore(subscribeNow, nowMs, serverNow);
  const past = recent.filter((f) => f.id !== running?.id);

  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">Fast</h2>
      <p className="mt-1 text-sm text-muted">
        Your clock. Change the start, the target, or the end while it runs — or after.
      </p>
      {running ? (
        <RunningFast now={now} fast={running} adjustments={adjustments} />
      ) : (
        <StartFast defaultStart={defaultStart} />
      )}
      {past.length > 0 ? (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm text-muted">Past fasts</summary>
          <ul className="mt-3 space-y-4">
            {past.map((fast) => (
              <li key={fast.id} className="rounded-2xl bg-bg-2 p-4">
                <CompletedFast fast={fast} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function StartFast({ defaultStart }: { defaultStart: string }) {
  return (
    <form action={startFastAction} className="mt-4 space-y-4">
      <fieldset>
        <legend className="text-sm text-muted">Protocol</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FAST_PROTOCOLS.map((p, i) => (
            <label
              key={p.id}
              className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-line bg-bg-2 px-2 text-sm has-[:checked]:border-copper has-[:checked]:text-copper-2"
            >
              <input
                type="radio"
                name="protocol"
                value={p.id}
                defaultChecked={i === 2}
                className="sr-only"
              />
              {p.label}
            </label>
          ))}
          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-line bg-bg-2 px-2 text-sm has-[:checked]:border-copper has-[:checked]:text-copper-2">
            <input type="radio" name="protocol" value="custom" className="sr-only" />
            Custom
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          Matched-calorie studies: the window helps adherence, not magic fat loss. 16:8 is a tool.
        </p>
      </fieldset>
      <label className="block text-sm text-muted">
        Custom hours
        <input name="hours" type="number" min={8} max={48} step={0.5} placeholder="16" className="mt-1" />
      </label>
      <label className="block text-sm text-muted">
        Started
        <input name="startedAt" type="datetime-local" defaultValue={defaultStart} required className="mt-1" />
      </label>
      <button className="btn-primary" type="submit">
        Start fast
      </button>
    </form>
  );
}

function RunningFast({
  now,
  fast,
  adjustments,
}: {
  now: number;
  fast: FastRow;
  adjustments: AdjRow[];
}) {
  const end = Date.parse(fast.plannedEndAt);
  const start = Date.parse(fast.startedAt);
  const remaining = end - now;
  const elapsed = now - start;
  const targetMs = fast.targetMinutes * 60_000;
  const pct = Math.max(0, Math.min(100, (elapsed / Math.max(1, targetMs)) * 100));
  const overtime = remaining <= 0;

  return (
    <div className="mt-4">
      <div className="flex flex-col items-center">
        <div
          className="grid h-44 w-44 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--copper) ${pct}%, var(--bg-2) 0)`,
          }}
        >
          <div className="grid h-36 w-36 place-items-center rounded-full bg-surface text-center">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {overtime ? "Window open" : "Remaining"}
              </p>
              <p className="display text-3xl leading-none" suppressHydrationWarning>
                {overtime ? formatDuration(now - end) : formatDuration(remaining)}
              </p>
              <p className="mt-1 text-xs text-muted">{fast.protocol}</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          {formatClock(fast.startedAt)} → {formatClock(fast.plannedEndAt)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <form action={nudgeFastAction}>
          <input type="hidden" name="fastId" value={fast.id} />
          <input type="hidden" name="minutes" value="-30" />
          <button className="btn-quiet w-full" type="submit">
            −30 min
          </button>
        </form>
        <form action={nudgeFastAction}>
          <input type="hidden" name="fastId" value={fast.id} />
          <input type="hidden" name="minutes" value="30" />
          <button className="btn-quiet w-full" type="submit">
            +30 min
          </button>
        </form>
        <form action={nudgeFastAction}>
          <input type="hidden" name="fastId" value={fast.id} />
          <input type="hidden" name="minutes" value="-60" />
          <button className="btn-quiet w-full" type="submit">
            −1 h
          </button>
        </form>
        <form action={nudgeFastAction}>
          <input type="hidden" name="fastId" value={fast.id} />
          <input type="hidden" name="minutes" value="60" />
          <button className="btn-quiet w-full" type="submit">
            +1 h
          </button>
        </form>
      </div>

      <form action={endFastAction} className="mt-3">
        <input type="hidden" name="fastId" value={fast.id} />
        <button className="btn-primary" type="submit">
          End now
        </button>
      </form>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-muted">Adjust start or eat-at time</summary>
        <form action={adjustFastAction} className="mt-3 space-y-3">
          <input type="hidden" name="fastId" value={fast.id} />
          <input type="hidden" name="mode" value="start" />
          <label className="block text-sm text-muted">
            Actually started
            <input
              name="startedAt"
              type="datetime-local"
              defaultValue={isoToLocalInput(fast.startedAt)}
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm text-muted">
            Target hours
            <input
              name="hours"
              type="number"
              min={8}
              max={48}
              step={0.5}
              defaultValue={Math.round((fast.targetMinutes / 60) * 2) / 2}
              className="mt-1"
            />
          </label>
          <button className="btn-quiet w-full" type="submit">
            Save start and length
          </button>
        </form>
        <form action={adjustFastAction} className="mt-3 space-y-3">
          <input type="hidden" name="fastId" value={fast.id} />
          <input type="hidden" name="mode" value="end" />
          <label className="block text-sm text-muted">
            Eat at
            <input
              name="plannedEndAt"
              type="datetime-local"
              defaultValue={isoToLocalInput(fast.plannedEndAt)}
              className="mt-1"
            />
          </label>
          <button className="btn-quiet w-full" type="submit">
            Save eat-at time
          </button>
        </form>
        <form action={endFastAction} className="mt-3 space-y-3">
          <input type="hidden" name="fastId" value={fast.id} />
          <label className="block text-sm text-muted">
            I already ate at
            <input
              name="endedAt"
              type="datetime-local"
              defaultValue={isoToLocalInput(new Date().toISOString())}
              className="mt-1"
            />
          </label>
          <button className="btn-quiet w-full" type="submit">
            End at that time
          </button>
        </form>
        <form action={endFastAction} className="mt-2">
          <input type="hidden" name="fastId" value={fast.id} />
          <input type="hidden" name="abort" value="1" />
          <button className="btn-quiet w-full text-danger" type="submit">
            Stop without counting it
          </button>
        </form>
      </details>

      {adjustments.length > 0 ? (
        <ul className="mt-4 space-y-1 text-xs text-muted">
          {adjustments.slice(0, 6).map((a) => (
            <li key={a.id}>
              {formatClock(a.createdAt)} · {a.summary}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CompletedFast({ fast }: { fast: FastRow }) {
  const ended = fast.endedAt ?? fast.plannedEndAt;
  return (
    <div>
      <p className="text-sm">
        {fast.protocol} · {formatElapsedLabel(fast.startedAt, ended)} ·{" "}
        {fast.status === "aborted" ? "stopped" : "done"}
      </p>
      <p className="text-xs text-muted">
        {formatClock(fast.startedAt)} → {formatClock(ended)}
      </p>
      {fast.notes ? <p className="mt-1 text-xs text-muted">{fast.notes}</p> : null}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-muted">Edit this fast</summary>
        <form action={adjustFastAction} className="mt-3 space-y-3">
          <input type="hidden" name="fastId" value={fast.id} />
          <input type="hidden" name="mode" value="end" />
          <label className="block text-sm text-muted">
            Started
            <input
              name="startedAt"
              type="datetime-local"
              defaultValue={isoToLocalInput(fast.startedAt)}
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm text-muted">
            Ended
            <input
              name="plannedEndAt"
              type="datetime-local"
              defaultValue={isoToLocalInput(ended)}
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm text-muted">
            Note
            <input name="notes" defaultValue={fast.notes ?? ""} className="mt-1" />
          </label>
          <button className="btn-quiet w-full" type="submit">
            Save times
          </button>
        </form>
      </details>
    </div>
  );
}

export function FastingStrip({ running }: { running: FastRow }) {
  const startedMs = Date.parse(running.startedAt);
  const now = useSyncExternalStore(subscribeNow, nowMs, () => startedMs);
  const remaining = Date.parse(running.plannedEndAt) - now;
  const overtime = remaining <= 0;
  return (
    <p className="mt-2 text-center text-sm text-muted" suppressHydrationWarning>
      Fast {running.protocol}: {overtime ? "window open" : formatDuration(remaining)} left
    </p>
  );
}
