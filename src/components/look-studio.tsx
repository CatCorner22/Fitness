"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { saveLookAction } from "@/app/actions/look";
import { KawaiiAvatar } from "@/components/kawaii-avatar";
import {
  ACCENTS,
  AVATAR_GROUPS,
  FONTS,
  LOOK_PREVIEW_EVENT,
  PALETTES,
  TYPE_SIZES,
  avatarById,
  type LookPrefs,
} from "@/lib/look";

type LookState = LookPrefs & { theme: "dark" | "light" };

function applyLook(next: LookState) {
  const html = document.documentElement;
  html.classList.toggle("light", next.theme === "light");
  html.dataset.palette = next.palette;
  html.dataset.size = next.size;
  html.dataset.font = next.font;
  html.dataset.accent = next.accent;
  window.dispatchEvent(new CustomEvent(LOOK_PREVIEW_EVENT, { detail: next }));
}

function LookChoice({
  selected,
  onPick,
  className,
  label,
  children,
}: {
  selected: boolean;
  onPick: () => void;
  className: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={onPick}
      className={`w-full cursor-pointer appearance-none bg-transparent ${className}`}
    >
      {children}
    </button>
  );
}

export function LookStudio({ initial }: { initial: LookState }) {
  const [look, setLook] = useState(initial);
  const persist = useRef(false);
  const selected = avatarById(look.avatar);

  useEffect(() => {
    return () => {
      if (!persist.current) applyLook(initial);
    };
  }, [initial]);

  function update<K extends keyof LookState>(key: K, value: LookState[K]) {
    const next = { ...look, [key]: value };
    setLook(next);
    applyLook(next);
  }

  return (
    <form
      action={saveLookAction}
      onSubmit={() => {
        persist.current = true;
      }}
      className="relative z-10 space-y-6 rounded-3xl border border-line bg-surface p-5"
    >
      <input type="hidden" name="avatar" value={look.avatar} />
      <input type="hidden" name="palette" value={look.palette} />
      <input type="hidden" name="size" value={look.size} />
      <input type="hidden" name="font" value={look.font} />
      <input type="hidden" name="accent" value={look.accent} />
      <input type="hidden" name="theme" value={look.theme} />
      <div className="flex items-center gap-4">
        <KawaiiAvatar id={look.avatar} size={72} />
        <div>
          <h2 className="display text-2xl">Look</h2>
          <p className="mt-1 text-sm text-muted">
            {selected.name} · colors, type, cute face. Preview now. Save to keep.
          </p>
        </div>
      </div>

      {AVATAR_GROUPS.map((group) => (
        <fieldset key={group.id}>
          <legend className="text-sm text-muted">{group.label}</legend>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {group.ids.map((id) => {
              const avatar = avatarById(id);
              const on = look.avatar === avatar.id;
              return (
                <LookChoice
                  key={avatar.id}
                  selected={on}
                  label={avatar.name}
                  onPick={() => update("avatar", avatar.id)}
                  className={`flex min-h-16 flex-col items-center gap-1 rounded-2xl border p-2 ${
                    on ? "border-copper bg-copper/15" : "border-line"
                  }`}
                >
                  <KawaiiAvatar id={avatar.id} size={52} />
                  <span className="text-[11px] text-muted">{avatar.name}</span>
                </LookChoice>
              );
            })}
          </div>
        </fieldset>
      ))}

      <fieldset>
        <legend className="text-sm text-muted">Colors</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PALETTES.map((palette) => {
            const on = look.palette === palette.id;
            return (
              <LookChoice
                key={palette.id}
                selected={on}
                label={palette.label}
                onPick={() => update("palette", palette.id)}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left ${
                  on ? "border-copper bg-copper/15" : "border-line"
                }`}
              >
                <span className={`swatch swatch-${palette.id} h-8 w-8 shrink-0 rounded-full border border-line`} />
                <span>
                  <span className="block text-sm font-semibold text-ink">{palette.label}</span>
                  <span className="block text-xs text-muted">{palette.hint}</span>
                </span>
              </LookChoice>
            );
          })}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={look.theme === "light"}
          onChange={(e) => update("theme", e.target.checked ? "light" : "dark")}
          className="w-auto"
        />
        Light screen
      </label>

      <fieldset>
        <legend className="text-sm text-muted">Text size</legend>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TYPE_SIZES.map((size) => {
            const on = look.size === size.id;
            return (
              <LookChoice
                key={size.id}
                selected={on}
                label={size.label}
                onPick={() => update("size", size.id)}
                className={`flex min-h-11 items-center justify-center rounded-2xl border text-sm ${
                  on ? "border-copper bg-copper/15 text-copper-2" : "border-line text-muted"
                }`}
              >
                {size.label}
              </LookChoice>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm text-muted">Font</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {FONTS.map((font) => {
            const on = look.font === font.id;
            return (
              <LookChoice
                key={font.id}
                selected={on}
                label={font.label}
                onPick={() => update("font", font.id)}
                className={`flex min-h-14 flex-col justify-center rounded-2xl border px-3 text-left ${
                  on ? "border-copper bg-copper/15" : "border-line"
                }`}
              >
                <span className={`font-preview font-preview-${font.id} text-base font-semibold text-ink`}>{font.label}</span>
                <span className="text-xs text-muted">{font.sample}</span>
              </LookChoice>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm text-muted">Visual accents</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ACCENTS.map((accent) => {
            const on = look.accent === accent.id;
            return (
              <LookChoice
                key={accent.id}
                selected={on}
                label={accent.label}
                onPick={() => update("accent", accent.id)}
                className={`flex min-h-11 items-center justify-center rounded-2xl border text-sm ${
                  on ? "border-copper bg-copper/15 text-copper-2" : "border-line text-muted"
                }`}
              >
                {accent.label}
              </LookChoice>
            );
          })}
        </div>
      </fieldset>

      <button className="btn-primary" type="submit">
        Save look
      </button>
    </form>
  );
}
