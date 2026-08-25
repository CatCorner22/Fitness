import type { DiagramKind } from "@/lib/course/types";

function Figure({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-line bg-bg-2 p-4">
      <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label={label}>
        <rect width="320" height="180" fill="#1b1914" />
        {children}
      </svg>
      <figcaption className="mt-2 text-center text-xs text-muted">{label}</figcaption>
    </figure>
  );
}

const copper = "#e07a3d";
const ink = "#f4efe6";
const muted = "#c9c0b0";

export function SkillDiagram({ kind }: { kind: DiagramKind }) {
  if (kind === "walk") {
    return (
      <Figure label="1 stand · 2 step · 3 pause pose">
        <circle cx="50" cy="40" r="10" fill={ink} />
        <line x1="50" y1="50" x2="50" y2="110" stroke={ink} strokeWidth="6" />
        <line x1="50" y1="70" x2="28" y2="95" stroke={ink} strokeWidth="5" />
        <line x1="50" y1="70" x2="72" y2="95" stroke={ink} strokeWidth="5" />
        <line x1="50" y1="110" x2="38" y2="155" stroke={ink} strokeWidth="5" />
        <line x1="50" y1="110" x2="62" y2="155" stroke={ink} strokeWidth="5" />
        <text x="50" y="172" textAnchor="middle" fill={muted} fontSize="12">
          1
        </text>
        <circle cx="160" cy="40" r="10" fill={ink} />
        <line x1="160" y1="50" x2="168" y2="110" stroke={ink} strokeWidth="6" />
        <line x1="168" y1="110" x2="140" y2="155" stroke={copper} strokeWidth="5" />
        <line x1="168" y1="110" x2="200" y2="145" stroke={ink} strokeWidth="5" />
        <text x="160" y="172" textAnchor="middle" fill={muted} fontSize="12">
          2
        </text>
        <circle cx="270" cy="36" r="10" fill={ink} />
        <line x1="270" y1="46" x2="270" y2="108" stroke={ink} strokeWidth="6" />
        <line x1="270" y1="68" x2="242" y2="58" stroke={copper} strokeWidth="5" />
        <line x1="270" y1="68" x2="298" y2="58" stroke={copper} strokeWidth="5" />
        <line x1="270" y1="108" x2="258" y2="155" stroke={ink} strokeWidth="5" />
        <line x1="270" y1="108" x2="282" y2="155" stroke={ink} strokeWidth="5" />
        <text x="270" y="172" textAnchor="middle" fill={muted} fontSize="12">
          3
        </text>
      </Figure>
    );
  }
  if (kind === "wave" || kind === "hip8") {
    return (
      <Figure label="Knees · hips · chest (ribs stacked)">
        <path d="M40 140 C80 140 80 40 160 40 C240 40 240 140 280 140" fill="none" stroke={copper} strokeWidth="4" />
        <circle cx="80" cy="128" r="7" fill={ink} />
        <circle cx="160" cy="48" r="7" fill={ink} />
        <circle cx="240" cy="128" r="7" fill={ink} />
        <text x="80" y="168" textAnchor="middle" fill={muted} fontSize="12">
          knees
        </text>
        <text x="160" y="28" textAnchor="middle" fill={muted} fontSize="12">
          hips
        </text>
        <text x="240" y="168" textAnchor="middle" fill={muted} fontSize="12">
          chest
        </text>
      </Figure>
    );
  }
  if (kind === "floor" || kind === "tabletop" || kind === "knee") {
    return (
      <Figure label="Pads · tabletop · circle · stand">
        <rect x="30" y="120" width="80" height="14" rx="4" fill={copper} opacity="0.5" />
        <rect x="120" y="120" width="80" height="14" rx="4" fill={copper} opacity="0.5" />
        <line x1="70" y1="90" x2="70" y2="120" stroke={ink} strokeWidth="6" />
        <line x1="70" y1="90" x2="110" y2="90" stroke={ink} strokeWidth="6" />
        <line x1="110" y1="90" x2="110" y2="120" stroke={ink} strokeWidth="6" />
        <circle cx="70" cy="78" r="8" fill={ink} />
        <circle cx="230" cy="70" r="40" fill="none" stroke={copper} strokeWidth="3" strokeDasharray="6 6" />
        <text x="70" y="160" textAnchor="middle" fill={muted} fontSize="12">
          tabletop
        </text>
        <text x="230" y="160" textAnchor="middle" fill={muted} fontSize="12">
          circle both ways
        </text>
      </Figure>
    );
  }
  if (kind === "chair") {
    return (
      <Figure label="Walk in · sit edge · open · stand">
        <rect x="130" y="90" width="70" height="50" fill="none" stroke={ink} strokeWidth="4" />
        <line x1="140" y1="140" x2="140" y2="170" stroke={ink} strokeWidth="4" />
        <line x1="190" y1="140" x2="190" y2="170" stroke={ink} strokeWidth="4" />
        <circle cx="60" cy="70" r="8" fill={ink} />
        <line x1="60" y1="78" x2="60" y2="150" stroke={ink} strokeWidth="5" />
        <path d="M60 150 L100 150" stroke={copper} strokeWidth="3" markerEnd="url(#arrow)" />
        <circle cx="165" cy="55" r="8" fill={ink} />
        <text x="60" y="172" textAnchor="middle" fill={muted} fontSize="12">
          1 walk
        </text>
        <text x="165" y="40" textAnchor="middle" fill={muted} fontSize="12">
          2 sit
        </text>
      </Figure>
    );
  }
  if (kind === "polewalk" || kind === "fireman" || kind === "sit" || kind === "climb") {
    return (
      <Figure label="Both sides · mat · down is a skill">
        <rect x="154" y="20" width="12" height="140" rx="6" fill={muted} />
        <circle cx="120" cy="50" r="8" fill={ink} />
        <line x1="120" y1="58" x2="160" y2="90" stroke={copper} strokeWidth="5" />
        <line x1="160" y1="90" x2="110" y2="140" stroke={ink} strokeWidth="5" />
        <circle cx="210" cy="50" r="8" fill={ink} />
        <line x1="210" y1="58" x2="166" y2="90" stroke={copper} strokeWidth="5" />
        <line x1="166" y1="90" x2="230" y2="140" stroke={ink} strokeWidth="5" />
        <text x="90" y="172" textAnchor="middle" fill={muted} fontSize="12">
          side A
        </text>
        <text x="230" y="172" textAnchor="middle" fill={muted} fontSize="12">
          side B
        </text>
      </Figure>
    );
  }
  if (kind === "hang") {
    return (
      <Figure label="Pack shoulders · short hangs · full rest">
        <line x1="40" y1="30" x2="280" y2="30" stroke={muted} strokeWidth="8" />
        <line x1="120" y1="30" x2="120" y2="70" stroke={ink} strokeWidth="5" />
        <line x1="200" y1="30" x2="200" y2="70" stroke={ink} strokeWidth="5" />
        <circle cx="160" cy="95" r="10" fill={ink} />
        <line x1="160" y1="105" x2="160" y2="155" stroke={ink} strokeWidth="6" />
        <text x="160" y="172" textAnchor="middle" fill={muted} fontSize="12">
          active hang
        </text>
      </Figure>
    );
  }
  if (kind === "heels") {
    return (
      <Figure label="Shorter step · tall ankle · same slow">
        <line x1="40" y1="150" x2="280" y2="150" stroke={muted} strokeWidth="2" />
        <polygon points="70,150 78,118 88,150" fill={copper} />
        <line x1="78" y1="118" x2="78" y2="70" stroke={ink} strokeWidth="5" />
        <circle cx="78" cy="52" r="9" fill={ink} />
        <polygon points="150,150 162,114 176,150" fill={copper} />
        <line x1="162" y1="114" x2="168" y2="68" stroke={ink} strokeWidth="5" />
        <circle cx="170" cy="50" r="9" fill={ink} />
        <polygon points="230,150 238,120 250,150" fill={copper} />
        <line x1="238" y1="120" x2="238" y2="72" stroke={ink} strokeWidth="5" />
        <circle cx="238" cy="54" r="9" fill={ink} />
        <text x="78" y="172" textAnchor="middle" fill={muted} fontSize="12">
          1
        </text>
        <text x="162" y="172" textAnchor="middle" fill={muted} fontSize="12">
          2
        </text>
        <text x="238" y="172" textAnchor="middle" fill={muted} fontSize="12">
          pause
        </text>
      </Figure>
    );
  }
  if (kind === "hands") {
    return (
      <Figure label="Trace · open palm · walk">
        <circle cx="70" cy="70" r="22" fill="none" stroke={ink} strokeWidth="3" />
        <line x1="70" y1="92" x2="70" y2="140" stroke={ink} strokeWidth="5" />
        <path d="M110 90 C150 50 190 50 230 90" fill="none" stroke={copper} strokeWidth="4" />
        <ellipse cx="250" cy="100" rx="22" ry="14" fill="none" stroke={copper} strokeWidth="3" />
        <text x="70" y="168" textAnchor="middle" fill={muted} fontSize="12">
          frame
        </text>
        <text x="160" y="36" textAnchor="middle" fill={muted} fontSize="12">
          trace
        </text>
        <text x="250" y="168" textAnchor="middle" fill={muted} fontSize="12">
          receive
        </text>
      </Figure>
    );
  }
  if (kind === "crawl") {
    return (
      <Figure label="Opposite hand · opposite knee">
        <rect x="30" y="120" width="260" height="12" rx="4" fill={copper} opacity="0.35" />
        <circle cx="80" cy="88" r="8" fill={ink} />
        <line x1="80" y1="96" x2="120" y2="120" stroke={ink} strokeWidth="5" />
        <line x1="80" y1="96" x2="50" y2="120" stroke={copper} strokeWidth="5" />
        <circle cx="180" cy="80" r="8" fill={ink} />
        <line x1="180" y1="88" x2="150" y2="120" stroke={ink} strokeWidth="5" />
        <line x1="180" y1="88" x2="220" y2="120" stroke={copper} strokeWidth="5" />
        <text x="80" y="160" textAnchor="middle" fill={muted} fontSize="12">
          1
        </text>
        <text x="180" y="160" textAnchor="middle" fill={muted} fontSize="12">
          2
        </text>
      </Figure>
    );
  }
  if (kind === "grind") {
    return (
      <Figure label="Hips draw · ribs quiet · air gap">
        <rect x="210" y="50" width="18" height="110" rx="6" fill={muted} />
        <ellipse cx="120" cy="110" rx="50" ry="28" fill="none" stroke={copper} strokeWidth="4" />
        <circle cx="120" cy="70" r="10" fill={ink} />
        <line x1="120" y1="80" x2="120" y2="130" stroke={ink} strokeWidth="6" />
        <text x="120" y="168" textAnchor="middle" fill={muted} fontSize="12">
          circle both ways
        </text>
      </Figure>
    );
  }
  if (kind === "song") {
    return (
      <Figure label="Song 1 arrive · rest · song 2 body · close">
        {["arrive", "rest", "body", "close"].map((w, i) => (
          <g key={w}>
            <rect x={24 + i * 74} y="50" width="64" height="64" rx="12" fill={i === 1 ? "#2b261e" : copper} />
            <text x={56 + i * 74} y="88" textAnchor="middle" fill={ink} fontSize="11">
              {w}
            </text>
          </g>
        ))}
      </Figure>
    );
  }
  if (kind === "exit") {
    return (
      <Figure label="Still · look · pose · walk off">
        <circle cx="70" cy="70" r="10" fill={ink} />
        <line x1="70" y1="80" x2="70" y2="140" stroke={ink} strokeWidth="6" />
        <circle cx="160" cy="60" r="10" fill={ink} />
        <line x1="160" y1="70" x2="148" y2="50" stroke={copper} strokeWidth="4" />
        <circle cx="250" cy="70" r="10" fill={ink} />
        <line x1="250" y1="80" x2="280" y2="140" stroke={copper} strokeWidth="5" />
        <text x="70" y="168" textAnchor="middle" fill={muted} fontSize="12">
          still
        </text>
        <text x="160" y="168" textAnchor="middle" fill={muted} fontSize="12">
          look
        </text>
        <text x="250" y="168" textAnchor="middle" fill={muted} fontSize="12">
          off
        </text>
      </Figure>
    );
  }
  if (kind === "layer" || kind === "phrase") {
    return (
      <Figure label="8-count: walk · wave · pose · turn">
        {["walk", "wave", "pose", "turn"].map((w, i) => (
          <g key={w}>
            <rect x={24 + i * 74} y="50" width="64" height="64" rx="12" fill={i === 2 ? copper : "#2b261e"} />
            <text x={56 + i * 74} y="88" textAnchor="middle" fill={ink} fontSize="12">
              {i * 2 + 1}–{i * 2 + 2}
            </text>
            <text x={56 + i * 74} y="140" textAnchor="middle" fill={muted} fontSize="12">
              {w}
            </text>
          </g>
        ))}
      </Figure>
    );
  }
  return (
    <Figure label="40s on · 20s change · 4–6 rounds">
      {["squat", "push", "hollow", "carry"].map((w, i) => (
        <g key={w}>
          <circle cx={50 + i * 74} cy="80" r="28" fill="none" stroke={copper} strokeWidth="3" />
          <text x={50 + i * 74} y="86" textAnchor="middle" fill={ink} fontSize="11">
            {w}
          </text>
        </g>
      ))}
    </Figure>
  );
}
