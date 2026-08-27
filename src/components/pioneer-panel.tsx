"use client";

import type { ClipboardEvent } from "react";
import Link from "next/link";
import { PioneerCompass } from "@/components/pioneer-compass";
import { PIONEER_DISCLAIMER } from "@/lib/pioneer/types";
import type {
  PioneerGauges,
  PioneerLayer,
  PioneerMood,
  PioneerObservation,
  PioneerStatus,
} from "@/lib/pioneer/types";

function blockCopy(e: ClipboardEvent) {
  e.preventDefault();
}

function GaugeRail({
  label,
  value,
  applicable,
  warn,
}: {
  label: string;
  value: number;
  applicable: boolean;
  warn: boolean;
}) {
  const pct = Math.round(Math.min(100, Math.max(0, value * 100)));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span>{applicable ? `${pct}%` : "—"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full rounded-full transition-all ${
            !applicable ? "bg-line" : warn ? "bg-copper" : "bg-moss"
          }`}
          style={{ width: applicable ? `${pct}%` : "12%" }}
        />
      </div>
    </div>
  );
}

export function PioneerPanel({
  status,
  statusLine,
  layer,
  mood,
  gauges,
  observations,
  corroboration,
  profile,
  compact,
}: {
  status: PioneerStatus;
  statusLine: string;
  layer: PioneerLayer;
  mood: PioneerMood;
  gauges: PioneerGauges;
  observations: PioneerObservation[];
  corroboration?: { seen: number; reads: number };
  profile?: string;
  compact?: boolean;
}) {
  return (
    <aside
      className="pioneer-silent rounded-3xl border border-copper/30 bg-gradient-to-br from-surface to-bg-2 p-4 md:p-5"
      onCopy={blockCopy}
      onCut={blockCopy}
    >
      <div className={`flex gap-4 ${compact ? "items-center" : "items-start"}`}>
        <PioneerCompass onCourse={gauges.onCourse} mood={mood} size={compact ? 72 : 88} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="display text-xl text-copper-2">Pioneer</h2>
            <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
              observe only
            </span>
            <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
              {layer}
            </span>
            {profile && profile !== "standard" ? (
              <span className="rounded-full bg-copper/15 px-2 py-0.5 text-[10px] text-copper-2">
                {profile} mode
              </span>
            ) : null}
            {corroboration ? (
              <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] text-muted">
                seen {corroboration.seen}/{corroboration.reads} reads
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted" aria-live="polite">
            {statusLine}
          </p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["stimulus", gauges.stimulus],
              ["fuel", gauges.fuel],
              ["recovery", gauges.recovery],
              ["safety", gauges.safety],
              ["adherence", gauges.adherence],
            ] as const
          ).map(([key, g]) => (
            <GaugeRail
              key={key}
              label={g.label}
              value={g.value}
              applicable={g.applicable}
              warn={g.value < 0.62}
            />
          ))}
        </div>
      ) : null}

      <ul className="mt-4 space-y-3">
        {observations.length === 0 && status !== "reading" ? (
          <li className="text-sm text-muted">No flags yet. Keep writing. Pioneer does not fill the page.</li>
        ) : null}
        {observations.map((obs) => (
          <li key={`${obs.layer}-${obs.id}`} className="rounded-2xl border border-line bg-bg/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                {obs.layer}
              </span>
              <span className="text-[10px] text-muted">{obs.source}</span>
            </div>
            <p className="mt-2 text-sm text-ink">{obs.what}</p>
            <p className="mt-1 text-xs text-muted">{obs.why}</p>
            {obs.question ? <p className="mt-2 text-sm text-copper-2">{obs.question}</p> : null}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] leading-relaxed text-muted">{PIONEER_DISCLAIMER}</p>
      {compact ? (
        <Link href="/pioneer" className="mt-3 inline-block text-sm text-copper-2">
          Open the draft →
        </Link>
      ) : null}
    </aside>
  );
}
