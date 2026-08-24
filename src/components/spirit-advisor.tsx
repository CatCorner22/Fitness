"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SpiritMascot } from "@/components/spirit-mascot";

type Mood = "proud" | "encouraging" | "caution" | "celebrate" | "thinking";

export type SpiritAdvicePanel = {
  message: string;
  why?: string;
  restSeconds: number;
  nextAction: string;
  weightDeltaKg: number | null;
  swapToExerciseId: string | null;
  mood: Mood;
  citeIds: string[];
  source?: "llm" | "rules";
  modes?: string[];
  profile?: string;
  reads?: number;
  corroboration?: { seen: number; reads: number };
  gauges?: {
    sessionProgress: number;
    rpeDrift: number;
    timeBudgetUsed: number;
    onTrack: boolean;
  };
};

function GaugeBar({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  const pct = Math.round(Math.min(100, Math.max(0, value * 100)));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full rounded-full transition-all ${tone === "warn" ? "bg-copper" : tone === "ok" ? "bg-moss" : "bg-copper/70"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SpiritAdvisor({
  advice,
  loading,
  aiAvailable,
  units,
  kgToDisplay,
  swapButton,
}: {
  advice: SpiritAdvicePanel | null;
  loading: boolean;
  aiAvailable: boolean;
  units: "lb" | "kg";
  kgToDisplay: (kg: number, units: "lb" | "kg") => number;
  swapButton?: ReactNode;
}) {
  const mood = advice?.mood ?? "encouraging";
  const gauges = advice?.gauges;

  return (
    <aside className="rounded-3xl border border-copper/30 bg-gradient-to-br from-surface to-bg-2 p-4 md:p-5">
      <div className="flex gap-4">
        <SpiritMascot mood={mood} size={80} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="display text-xl text-copper-2">Spirit</h2>
            <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
              snow leopard spotter
            </span>
            {aiAvailable ? (
              <span className="rounded-full bg-moss/20 px-2 py-0.5 text-[10px] text-moss">
                {advice?.source === "llm" ? "LLM live" : "LLM ready"}
              </span>
            ) : (
              <span className="rounded-full bg-line px-2 py-0.5 text-[10px] text-muted">rules + KB</span>
            )}
            {advice?.corroboration ? (
              <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] text-muted">
                seen {advice.corroboration.seen}/{advice.corroboration.reads} reads
              </span>
            ) : null}
            {advice?.profile && advice.profile !== "standard" ? (
              <span className="rounded-full bg-copper/15 px-2 py-0.5 text-[10px] text-copper-2">
                {advice.profile} mode
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-relaxed text-ink">
            {loading
              ? "*ears perk* Reading your set..."
              : advice?.message ?? "Log a set and I'll pick your rest, load tweak, or safe swap. I'm watching, nya~"}
          </p>

          {advice?.why && !loading ? (
            <p className="mt-1 text-xs text-muted">{advice.why}</p>
          ) : null}

          {gauges && !loading ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <GaugeBar label="Set progress" value={gauges.sessionProgress} tone="ok" />
              <GaugeBar
                label="Time budget"
                value={gauges.timeBudgetUsed}
                tone={gauges.onTrack ? "ok" : "warn"}
              />
              <GaugeBar
                label="RPE heat"
                value={Math.min(1, Math.max(0, 0.5 + gauges.rpeDrift))}
                tone={gauges.rpeDrift > 0.15 ? "warn" : "ok"}
              />
            </div>
          ) : null}

          {advice && advice.restSeconds > 0 && !loading && (
            <p className="mt-2 text-xs text-muted">
              Rest cue: {advice.restSeconds}s
              {advice.weightDeltaKg
                ? ` · Load hint: ${advice.weightDeltaKg > 0 ? "+" : ""}${kgToDisplay(advice.weightDeltaKg, units)} ${units} next set`
                : ""}
              {advice.source === "llm" ? " · AI" : advice.source === "rules" ? " · evidence rules" : ""}
            </p>
          )}

          {advice?.citeIds?.length && !loading ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {advice.citeIds.map((id) => (
                <Link
                  key={id}
                  href={`/knowledge#${id}`}
                  className="rounded-full bg-bg px-2 py-0.5 text-[10px] text-copper-2 hover:underline"
                >
                  {id}
                </Link>
              ))}
            </div>
          ) : null}

          {swapButton}
        </div>
      </div>
    </aside>
  );
}
