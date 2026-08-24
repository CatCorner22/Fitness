"use client";

import { useMemo, useState } from "react";

const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

export function PlateCalc({ units }: { units: "lb" | "kg" }) {
  const [bar, setBar] = useState(units === "lb" ? 45 : 20);
  const [target, setTarget] = useState(units === "lb" ? 185 : 80);

  const plates = useMemo(() => {
    const available = units === "lb" ? PLATES_LB : PLATES_KG;
    let remaining = (target - bar) / 2;
    if (remaining <= 0) return [];
    const out: number[] = [];
    for (const p of available) {
      while (remaining + 1e-6 >= p) {
        out.push(p);
        remaining -= p;
      }
    }
    return out;
  }, [bar, target, units]);

  return (
    <details className="rounded-2xl border border-line bg-surface p-4 text-sm">
      <summary className="cursor-pointer text-muted">Plate calculator</summary>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">
          Bar
          <input type="number" value={bar} onChange={(e) => setBar(Number(e.target.value))} className="mt-1" />
        </label>
        <label className="text-xs text-muted">
          Target
          <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="mt-1" />
        </label>
      </div>
      <p className="mt-3 text-ink">
        Per side: {plates.length ? plates.join(" + ") : "just the bar"} {units}
      </p>
    </details>
  );
}