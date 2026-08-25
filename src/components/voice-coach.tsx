"use client";

import { useEffect, useRef, useState } from "react";
import { NYX } from "@/lib/course/instructor";

function pickVoice(voices: SpeechSynthesisVoice[]) {
  const hints = NYX.voice.nameHints.map((h) => h.toLowerCase());
  const female = voices.filter((v) => hints.some((h) => v.name.toLowerCase().includes(h) || v.lang.toLowerCase().includes("en")));
  const named = female.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  return named ?? female.find((v) => v.lang.startsWith("en")) ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

export function VoiceCoach({
  text,
  audioSrc,
  label = "Play Nyx",
}: {
  text: string;
  audioSrc?: string;
  label?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"file" | "speech" | "idle">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    return () => {
      window.speechSynthesis?.cancel();
      el?.pause();
    };
  }, []);

  function stop() {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setMode("idle");
  }

  async function playFile() {
    if (!audioSrc) return false;
    const el = audioRef.current;
    if (!el) return false;
    try {
      el.src = audioSrc;
      await el.play();
      setMode("file");
      setPlaying(true);
      return true;
    } catch {
      return false;
    }
  }

  function playSpeech() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = NYX.voice.rate;
    utter.pitch = NYX.voice.pitch;
    const voice = pickVoice(window.speechSynthesis.getVoices());
    if (voice) utter.voice = voice;
    utter.onend = () => {
      setPlaying(false);
      setMode("idle");
    };
    window.speechSynthesis.speak(utter);
    setMode("speech");
    setPlaying(true);
  }

  async function toggle() {
    if (playing) {
      stop();
      return;
    }
    const ok = await playFile();
    if (!ok) playSpeech();
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-4">
      <audio ref={audioRef} onEnded={stop} preload="none" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {NYX.name} · sultry spoken pass. Pause anytime. Replay freely.
        </p>
        <button type="button" className="btn-primary min-h-11 px-4" onClick={toggle}>
          {playing ? "Pause" : label}
        </button>
      </div>
      {mode === "speech" ? (
        <p className="mt-2 text-xs text-muted">Using this device’s female voice. Turn volume up.</p>
      ) : null}
    </div>
  );
}
