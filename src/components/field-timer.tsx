"use client";

import { useState } from "react";

export function FieldTimer({
  name,
  seconds: cap,
  label,
}: {
  name: string;
  seconds: number;
  label: string;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [id, setId] = useState<number | null>(null);

  function start() {
    if (id) window.clearInterval(id);
    const started = Date.now() - elapsed * 1000;
    const next = window.setInterval(() => {
      const s = Math.floor((Date.now() - started) / 1000);
      setElapsed(Math.min(cap, s));
      if (s >= cap) {
        window.clearInterval(next);
        setRunning(false);
      }
    }, 200);
    setId(next);
    setRunning(true);
  }

  function stop() {
    if (id) window.clearInterval(id);
    setId(null);
    setRunning(false);
  }

  function reset() {
    stop();
    setElapsed(0);
  }

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  return (
    <div className="rounded-2xl bg-bg-2 p-3">
      <input type="hidden" name={name} value={elapsed || ""} />
      <p className="text-sm text-muted">{label}</p>
      <p className="display text-3xl">
        {m}:{String(s).padStart(2, "0")}
      </p>
      <div className="mt-2 flex gap-2">
        {running ? (
          <button type="button" className="btn-quiet" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="button" className="btn-quiet" onClick={start}>
            Start
          </button>
        )}
        <button type="button" className="btn-quiet" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
