"use client";

import { useState } from "react";
import { convertDisplayHeight, convertDisplayWeight } from "@/lib/utils";

export function SettingsUnitsFields({
  initialUnits,
  initialWeight,
  initialHeight,
}: {
  initialUnits: "lb" | "kg";
  initialWeight: number | "";
  initialHeight: number | "";
}) {
  const [units, setUnits] = useState<"lb" | "kg">(initialUnits);
  const [weight, setWeight] = useState(initialWeight === "" ? "" : String(initialWeight));
  const [height, setHeight] = useState(initialHeight === "" ? "" : String(initialHeight));

  function onUnitsChange(next: "lb" | "kg") {
    if (next === units) return;
    const w = Number(weight);
    if (weight.trim() !== "" && Number.isFinite(w) && w > 0) {
      setWeight(String(convertDisplayWeight(w, units, next)));
    }
    const h = Number(height);
    if (height.trim() !== "" && Number.isFinite(h) && h > 0) {
      setHeight(String(convertDisplayHeight(h, units, next)));
    }
    setUnits(next);
  }

  return (
    <>
      <input type="hidden" name="displayUnits" value={units} />
      <label className="text-sm text-muted block">
        Units
        <select
          name="units"
          value={units}
          onChange={(e) => onUnitsChange(e.target.value === "kg" ? "kg" : "lb")}
          className="mt-1"
        >
          <option value="lb">Pounds</option>
          <option value="kg">Kilograms</option>
        </select>
      </label>
      <label className="text-sm text-muted block">
        Weight ({units})
        <input
          name="weight"
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="mt-1"
        />
      </label>
      <label className="text-sm text-muted block">
        Height ({units === "lb" ? "in" : "cm"})
        <input
          name="height"
          type="number"
          step="0.1"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="mt-1"
        />
      </label>
    </>
  );
}
