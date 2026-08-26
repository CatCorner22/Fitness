"use client";

import { useEffect, useRef, useState } from "react";

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
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    const started = Date.now() - elapsed * 1000;
    intervalRef.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - started) / 1000);
      setElapsed(Math.min(cap, s));
      if (s >= cap) {
        if (intervalRef.current != null) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
      }
    }, 200);
    setRunning(true);
  }

  function stop() {
    if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
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
