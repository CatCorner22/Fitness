type Mood = "proud" | "encouraging" | "caution" | "celebrate" | "thinking";

const MOOD_EMOJI: Record<Mood, string> = {
  proud: "✨",
  encouraging: "💪",
  caution: "🐾",
  celebrate: "🎉",
  thinking: "❄️",
};

export function SpiritMascot({
  mood = "encouraging",
  size = 72,
  className = "",
}: {
  mood?: Mood;
  size?: number;
  className?: string;
}) {
  const badge = MOOD_EMOJI[mood];
  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id="spiritFur" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8eef5" />
            <stop offset="100%" stopColor="#b8c5d8" />
          </linearGradient>
          <linearGradient id="spiritSpot" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
        </defs>
        {/* ears */}
        <ellipse cx="34" cy="28" rx="14" ry="18" fill="url(#spiritFur)" />
        <ellipse cx="86" cy="28" rx="14" ry="18" fill="url(#spiritFur)" />
        <ellipse cx="34" cy="30" rx="7" ry="10" fill="#f9a8d4" opacity="0.7" />
        <ellipse cx="86" cy="30" rx="7" ry="10" fill="#f9a8d4" opacity="0.7" />
        {/* head */}
        <circle cx="60" cy="62" r="38" fill="url(#spiritFur)" />
        {/* spots */}
        <circle cx="42" cy="50" r="5" fill="url(#spiritSpot)" opacity="0.55" />
        <circle cx="78" cy="48" r="4" fill="url(#spiritSpot)" opacity="0.5" />
        <circle cx="55" cy="78" r="6" fill="url(#spiritSpot)" opacity="0.45" />
        {/* eyes — kawaii */}
        <ellipse cx="48" cy="58" rx="7" ry="9" fill="#1f2937" />
        <ellipse cx="72" cy="58" rx="7" ry="9" fill="#1f2937" />
        <circle cx="50" cy="55" r="2.5" fill="#fff" />
        <circle cx="74" cy="55" r="2.5" fill="#fff" />
        {/* blush */}
        <ellipse cx="38" cy="68" rx="6" ry="3" fill="#f472b6" opacity="0.35" />
        <ellipse cx="82" cy="68" rx="6" ry="3" fill="#f472b6" opacity="0.35" />
        {/* muzzle */}
        <ellipse cx="60" cy="72" rx="12" ry="9" fill="#f8fafc" />
        <path d="M54 72 Q60 78 66 72" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="57" cy="70" r="1.2" fill="#374151" />
        <circle cx="63" cy="70" r="1.2" fill="#374151" />
        {/* tail hint */}
        <path
          d="M95 78 Q110 70 108 92 Q100 88 95 78"
          fill="url(#spiritFur)"
          stroke="#94a3b8"
          strokeWidth="1"
        />
      </svg>
      <span
        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-xs shadow"
        aria-hidden
      >
        {badge}
      </span>
    </div>
  );
}
