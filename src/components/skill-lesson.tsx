"use client";

import { useState } from "react";
import { SkillDiagram } from "@/components/skill-diagram";
import { VoiceCoach } from "@/components/voice-coach";
import { NYX } from "@/lib/course/instructor";
import type { Skill } from "@/lib/course/types";

const CHANNELS = [
  { id: "cue", label: "Cue" },
  { id: "steps", label: "Steps" },
  { id: "diagram", label: "Diagram" },
  { id: "photo", label: "Photo" },
  { id: "plate", label: "Plate" },
  { id: "voice", label: "Voice" },
  { id: "video", label: "Video" },
] as const;

type Channel = (typeof CHANNELS)[number]["id"];

export function SkillLesson({ skill, compact = false }: { skill: Skill; compact?: boolean }) {
  const [open, setOpen] = useState<Channel[]>(compact ? ["cue", "steps"] : ["cue", "steps", "diagram", "photo", "voice"]);

  function toggle(id: Channel) {
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-4">
      {!compact ? (
        <p className="text-sm text-muted">
          Pick any channel. Skip the rest. {NYX.name} will not rush you. Pain is a stop.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              open.includes(c.id) ? "border-copper bg-copper/15 text-copper-2" : "border-line text-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {open.includes("cue") ? (
        <p className="rounded-3xl border border-copper/40 bg-surface px-5 py-4 text-xl text-copper-2">{skill.cue}</p>
      ) : null}

      {open.includes("steps") ? (
        <ol className="space-y-2 rounded-3xl border border-line bg-surface p-5">
          {skill.steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm">
              <span className="text-copper-2">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {open.includes("diagram") ? <SkillDiagram kind={skill.diagram} /> : null}

      {open.includes("photo") ? (
        <figure className="overflow-hidden rounded-3xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={skill.photo} alt={`${NYX.name} demonstrating ${skill.name}`} className="w-full" />
          <figcaption className="bg-surface px-4 py-2 text-xs text-muted">
            Studio photo of {NYX.name}. Same character as the plates.
          </figcaption>
        </figure>
      ) : null}

      {open.includes("plate") ? (
        <figure className="overflow-hidden rounded-3xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={skill.plate} alt={`Illustrated topless plate: ${skill.name}`} className="w-full" />
          <figcaption className="bg-surface px-4 py-2 text-xs text-muted">
            Illustrated plate — adult, topless, yoga pants. Fictional instructor.
          </figcaption>
        </figure>
      ) : null}

      {open.includes("voice") ? <VoiceCoach text={skill.voiceScript} audioSrc={skill.audio} /> : null}

      {open.includes("video") && skill.video ? (
        <video className="w-full overflow-hidden rounded-3xl border border-line" controls playsInline preload="metadata">
          <source src={skill.video} type="video/mp4" />
        </video>
      ) : null}

      <details className="rounded-3xl border border-line bg-surface p-4 text-sm">
        <summary className="cursor-pointer text-muted">Watch-fors and safety</summary>
        <p className="mt-3">{skill.safety}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          {skill.watchFor.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        {skill.bothSides ? <p className="mt-2 text-copper-2">Equal work both sides. No bonus sets for the pretty side.</p> : null}
      </details>
    </div>
  );
}
