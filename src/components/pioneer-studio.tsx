"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { savePioneerDraftAction } from "@/app/actions/pioneer";
import { PioneerPanel } from "@/components/pioneer-panel";
import { PIONEER_DEBOUNCE_MS, PIONEER_MIN_CHARS } from "@/lib/pioneer/config";
import { detectInputEscape } from "@/lib/pioneer/escape";
import { gaugesToMood, instrumentObservations, measurePioneerGauges, statusLineFor } from "@/lib/pioneer/instrument";
import { findIdentifyingInfo } from "@/lib/pioneer/privacy";
import { parseDraftSignals } from "@/lib/pioneer/signals";
import { PIONEER_TEMPLATES } from "@/lib/pioneer/templates";
import type {
  PioneerHousehold,
  PioneerKind,
  PioneerObserveResult,
} from "@/lib/pioneer/types";

function localResult(text: string, kind: PioneerKind, household: PioneerHousehold): PioneerObserveResult {
  const signals = parseDraftSignals(text, kind);
  const gauges = measurePioneerGauges(text, household, signals);
  const privacy = findIdentifyingInfo(text);
  const escape = detectInputEscape(text);
  const status = privacy.hit || escape.hit ? "refused" : signals.charCount < 20 ? "waiting" : "instrument";
  return {
    status,
    layer: "instrument",
    observations: instrumentObservations(text, household, signals, gauges),
    gauges,
    mood: gaugesToMood(gauges),
    profile: "standard",
    reads: 0,
    promptVersion: "local",
    statusLine: statusLineFor({
      status,
      kind,
      charCount: signals.charCount,
      minChars: PIONEER_MIN_CHARS,
    }),
  };
}

export function PioneerStudio({
  initialTitle,
  initialBody,
  initialKind,
  household,
  pioneerEnabled,
  extraNames,
}: {
  initialTitle: string;
  initialBody: string;
  initialKind: PioneerKind;
  household: PioneerHousehold;
  pioneerEnabled: boolean;
  extraNames: string[];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [kind, setKind] = useState<PioneerKind>(initialKind);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [remote, setRemote] = useState<PioneerObserveResult | null>(null);
  const [remoteFor, setRemoteFor] = useState("");
  const [reading, setReading] = useState(false);
  const observeAbort = useRef<AbortController | null>(null);
  const lastBody = useRef(initialBody);
  const privacy = findIdentifyingInfo(body, extraNames);
  const escapeAttempt = detectInputEscape(body);
  const pioneerEligible =
    pioneerEnabled && !privacy.hit && !escapeAttempt.hit && body.trim().length >= PIONEER_MIN_CHARS;

  const local = useMemo(() => localResult(body, kind, household), [body, kind, household]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (title === initialTitle && body === lastBody.current && kind === initialKind) return;
      setSaved("saving");
      void savePioneerDraftAction({ title, body, kind }).then(() => {
        lastBody.current = body;
        setSaved("saved");
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [title, body, kind, initialTitle, initialKind]);

  useEffect(() => {
    if (!pioneerEligible) return;
    const snapshot = body;
    const t = window.setTimeout(() => {
      observeAbort.current?.abort();
      const ctrl = new AbortController();
      observeAbort.current = ctrl;
      setReading(true);
      void fetch("/api/pioneer/observe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: snapshot, kind }),
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (!res.ok) return;
          const json = (await res.json()) as PioneerObserveResult;
          setRemote(json);
          setRemoteFor(snapshot);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
        })
        .finally(() => {
          if (observeAbort.current === ctrl) setReading(false);
        });
    }, PIONEER_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [body, kind, pioneerEligible]);

  const matchedRemote = pioneerEligible && remote && remoteFor === body ? remote : null;
  const view: PioneerObserveResult = matchedRemote
    ? {
        ...matchedRemote,
        status: reading ? "reading" : matchedRemote.status,
        statusLine: reading ? "Reading the draft…" : matchedRemote.statusLine,
      }
    : {
        ...local,
        status: reading ? "reading" : local.status,
        statusLine: reading
          ? "Reading the draft…"
          : pioneerEnabled
            ? local.statusLine
            : "Pioneer dark — instruments still live",
        mood: pioneerEnabled ? local.mood : local.status === "refused" ? local.mood : "dark",
      };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label className="block min-w-0 flex-1 text-sm text-muted">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" maxLength={120} />
          </label>
          <label className="block text-sm text-muted">
            Kind
            <select value={kind} onChange={(e) => setKind(e.target.value as PioneerKind)} className="mt-1">
              <option value="mixed">Mixed</option>
              <option value="training">Training</option>
              <option value="nutrition">Nutrition</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {PIONEER_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="btn-quiet !w-auto px-3 py-2 text-xs"
              onClick={() => {
                setKind(tpl.kind);
                if (!title.trim()) setTitle(tpl.label);
                setBody((prev) => (prev.trim() ? prev : tpl.build(household)));
              }}
            >
              {tpl.label}
            </button>
          ))}
        </div>
        <label className="block text-sm text-muted">
          Draft
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="mt-1 min-h-72 resize-y font-mono text-[15px] leading-relaxed"
            placeholder="Write a week, a meal day, or a cut check. Pioneer watches. It never writes."
          />
        </label>
        <p className="text-xs text-muted">
          {body.trim().length} characters
          {saved === "saving" ? " · saving" : saved === "saved" ? " · saved on this device" : ""}
          {pioneerEnabled ? "" : " · pioneer model off"}
        </p>
      </section>
      <PioneerPanel
        status={view.status}
        statusLine={view.statusLine}
        layer={view.layer}
        mood={view.mood}
        gauges={view.gauges}
        observations={view.observations}
        corroboration={view.corroboration}
        profile={view.profile}
      />
    </div>
  );
}
