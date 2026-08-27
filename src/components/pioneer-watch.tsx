"use client";

import { useMemo } from "react";
import { PioneerPanel } from "@/components/pioneer-panel";
import { gaugesToMood, instrumentObservations, measurePioneerGauges, statusLineFor } from "@/lib/pioneer/instrument";
import { parseDraftSignals } from "@/lib/pioneer/signals";
import type { PioneerHousehold } from "@/lib/pioneer/types";

export function PioneerWatch({
  text,
  household,
}: {
  text: string;
  household: PioneerHousehold;
}) {
  const view = useMemo(() => {
    const signals = parseDraftSignals(text, "nutrition");
    const gauges = measurePioneerGauges(text, household, signals);
    return {
      gauges,
      observations: instrumentObservations(text, household, signals, gauges).slice(0, 3),
      mood: gaugesToMood(gauges),
      statusLine: statusLineFor({
        status: "instrument",
        kind: "nutrition",
        charCount: signals.charCount,
        minChars: 80,
      }),
    };
  }, [text, household]);

  return (
    <PioneerPanel
      status="instrument"
      statusLine={view.statusLine}
      layer="instrument"
      mood={view.mood}
      gauges={view.gauges}
      observations={view.observations}
      compact
    />
  );
}
