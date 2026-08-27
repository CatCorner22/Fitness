"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCompletion } from "@ai-sdk/react";
import { SpiritMascot } from "@/components/spirit-mascot";

export function SpiritTodayBriefing({
  aiAvailable,
  fallbackText,
}: {
  aiAvailable: boolean;
  fallbackText: string;
}) {
  const started = useRef(false);
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/spirit/briefing",
    // The briefing route streams plain text (toTextStreamResponse), not the
    // default SSE data protocol; without this the briefing renders blank.
    streamProtocol: "text",
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (aiAvailable) {
      complete("");
    }
  }, [aiAvailable, complete]);

  const text = aiAvailable ? completion || (isLoading ? "*stretches paws* Reading today's plan..." : "") : fallbackText;

  return (
    <section className="mb-6 rounded-3xl border border-copper/25 bg-gradient-to-br from-surface to-bg-2 p-5 md:p-6">
      <div className="flex gap-4">
        <SpiritMascot mood={isLoading ? "thinking" : "encouraging"} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wider text-copper">Spirit · today&apos;s briefing</p>
            {aiAvailable ? (
              <span className="rounded-full bg-moss/20 px-2 py-0.5 text-[10px] text-moss">
                {isLoading ? "streaming" : "live"}
              </span>
            ) : (
              <span className="rounded-full bg-line px-2 py-0.5 text-[10px] text-muted">rules</span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
          {error ? <p className="mt-2 text-xs text-copper">{error.message}</p> : null}
          <Link href="/coach" className="mt-3 inline-block text-sm text-copper-2">
            Ask Spirit more →
          </Link>
        </div>
      </div>
    </section>
  );
}
