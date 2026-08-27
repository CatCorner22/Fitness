import type { PioneerMood } from "@/lib/pioneer/types";

const MOOD_LABEL: Record<PioneerMood, string> = {
  on_course: "On course",
  drift: "Drifting",
  caution: "Hold",
  thinking: "Reading",
  dark: "Dark",
};

export function PioneerCompass({
  onCourse,
  mood,
  size = 88,
}: {
  onCourse: number;
  mood: PioneerMood;
  size?: number;
}) {
  const pct = Math.round(Math.min(100, Math.max(0, onCourse * 100)));
  const drift = (0.82 - onCourse) * 52;
  const needle = mood === "dark" ? 18 : drift;
  const ring =
    mood === "caution" ? "var(--danger)" : mood === "on_course" ? "var(--moss)" : "var(--copper)";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r="56" fill="var(--bg-2)" stroke={ring} strokeWidth="3" />
        <circle cx="60" cy="60" r="46" fill="var(--surface)" stroke="var(--line)" strokeWidth="1" />
        {[0, 45, 90, 135].map((deg) => (
          <line
            key={deg}
            x1="60"
            y1="18"
            x2="60"
            y2="26"
            stroke="var(--muted)"
            strokeWidth="2"
            transform={`rotate(${deg} 60 60)`}
          />
        ))}
        <text x="60" y="16" textAnchor="middle" fill="var(--copper)" fontSize="8" fontWeight="700">
          N
        </text>
        <g transform={`rotate(${needle} 60 60)`}>
          <polygon points="60,28 64,62 60,58 56,62" fill="var(--copper)" />
          <polygon points="60,92 64,62 60,66 56,62" fill="var(--muted)" />
        </g>
        <circle cx="60" cy="60" r="5" fill="var(--copper-2)" />
      </svg>
      <p className="absolute inset-x-0 -bottom-1 text-center text-[10px] uppercase tracking-wider text-muted">
        {MOOD_LABEL[mood]} · {pct}
      </p>
    </div>
  );
}
