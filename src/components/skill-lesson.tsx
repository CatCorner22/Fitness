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
type Studio = "watch" | "with" | "turn";

export function SkillLesson({ skill, compact = false }: { skill: Skill; compact?: boolean }) {
  const [open, setOpen] = useState<Channel[]>(
    compact ? ["cue", "steps"] : ["cue", "steps", "diagram", "photo", "voice"],
  );
  const [studio, setStudio] = useState<Studio>(compact ? "turn" : "watch");
  const [stepIndex, setStepIndex] = useState(0);
  const [oneAtATime, setOneAtATime] = useState(!compact);

  function toggle(id: Channel) {
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function pickStudio(next: Studio) {
    setStudio(next);
    if (next === "watch") setOpen(["photo", "plate", "diagram", "video"]);
    if (next === "with") setOpen(["cue", "steps", "voice"]);
    if (next === "turn") setOpen(["cue", "steps"]);
  }

  const practice =
    skill.practice ?? `Run the numbered steps once, slow. Rest. Repeat once. Pain is a stop.`;
  const passWhen =
    skill.passWhen ?? `You can do the numbered steps without looking, at the same slow tempo.`;

  return (
    <div className="space-y-4">
      {!compact ? (
        <>
          <p className="text-sm text-muted">
            Pick a studio, then any channel. Skip the rest. {NYX.name} will not rush you. Pain is a stop.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["watch", "Watch me"],
                ["with", "With Nyx"],
                ["turn", "Your turn"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => pickStudio(id)}
                className={`min-h-11 rounded-2xl border text-sm ${
                  studio === id ? "border-copper bg-copper/15 text-copper-2" : "border-line text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {skill.firstThen && !compact ? (
        <p className="rounded-3xl border border-line bg-bg-2 px-4 py-3 text-sm">
          <span className="text-muted">First </span>
          {skill.firstThen.first}
          <span className="text-muted"> · then </span>
          {skill.firstThen.then}
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
        <div className="space-y-3 rounded-3xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">Numbered steps</p>
            <button
              type="button"
              className="text-sm text-copper-2"
              onClick={() => {
                setOneAtATime((v) => !v);
                setStepIndex(0);
              }}
            >
              {oneAtATime ? "Show all steps" : "One step at a time"}
            </button>
          </div>
          {oneAtATime ? (
            <>
              <p className="flex gap-3 text-sm">
                <span className="text-copper-2">{stepIndex + 1}.</span>
                <span>{skill.steps[stepIndex]}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="min-h-11 flex-1 rounded-xl border border-line text-sm"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="min-h-11 flex-1 rounded-xl border border-line text-sm"
                  disabled={stepIndex >= skill.steps.length - 1}
                  onClick={() => setStepIndex((i) => Math.min(skill.steps.length - 1, i + 1))}
                >
                  Next
                </button>
              </div>
              <p className="text-xs text-muted">
                Step {stepIndex + 1} of {skill.steps.length}. No timer. Replay freely.
              </p>
            </>
          ) : (
            <ol className="space-y-2">
              {skill.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="text-copper-2">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
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

      {!compact ? (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-sm uppercase tracking-[0.16em] text-copper">Your turn</h2>
          <p className="mt-2 text-sm">{practice}</p>
          <p className="mt-3 text-sm text-copper-2">You can move on when: {passWhen}</p>
        </section>
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
