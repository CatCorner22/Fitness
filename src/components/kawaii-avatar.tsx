import type { ReactNode } from "react";
import { avatarById, type AvatarDef, type AvatarKind } from "@/lib/look";

export function KawaiiAvatar({
  id,
  size = 56,
  className = "",
  title,
}: {
  id: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const avatar = avatarById(id);
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? avatar.name}
    >
      <KindMarks avatar={avatar} />
      <Face avatar={avatar} />
      <ExtraMark extra={avatar.extra} color={avatar.blush} />
    </svg>
  );
}

function Face({ avatar }: { avatar: AvatarDef }) {
  const dark = avatar.fur === "#1f2937" || avatar.kind === "sunflower";
  const eye = dark ? "#fff7ed" : "#1f2937";
  const shine = dark ? "#1f2937" : "#fff";
  return (
    <>
      <ellipse cx="38" cy="74" rx="8" ry="4" fill={avatar.blush} opacity="0.55" />
      <ellipse cx="82" cy="74" rx="8" ry="4" fill={avatar.blush} opacity="0.55" />
      <ellipse cx="46" cy="58" rx="7" ry="9" fill={eye} />
      <ellipse cx="74" cy="58" rx="7" ry="9" fill={eye} />
      <circle cx="48" cy="55" r="2.4" fill={shine} />
      <circle cx="76" cy="55" r="2.4" fill={shine} />
      <path d="M54 76 Q60 82 66 76" stroke={eye} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  );
}

function Round({ fill, children }: { fill: string; children?: ReactNode }) {
  return (
    <>
      <circle cx="60" cy="60" r="58" fill={fill} />
      {children}
    </>
  );
}

function KindMarks({ avatar }: { avatar: AvatarDef }) {
  const kind: AvatarKind = avatar.kind;
  const { fur, inner } = avatar;

  if (kind === "cat" || kind === "calico") {
    return (
      <>
        <Round fill={fur}>
          {kind === "calico" ? (
            <>
              <ellipse cx="38" cy="42" rx="22" ry="18" fill="#fdba74" />
              <ellipse cx="88" cy="70" rx="18" ry="16" fill="#1f2937" />
            </>
          ) : null}
        </Round>
        <polygon points="22,38 38,18 46,42" fill={fur} />
        <polygon points="98,38 82,18 74,42" fill={fur} />
        <polygon points="28,36 38,24 42,40" fill={inner} />
        <polygon points="92,36 82,24 78,40" fill={inner} />
        <ellipse cx="60" cy="78" rx="10" ry="7" fill={inner} />
      </>
    );
  }
  if (kind === "bunny") {
    return (
      <>
        <ellipse cx="40" cy="14" rx="10" ry="22" fill={fur} />
        <ellipse cx="80" cy="14" rx="10" ry="22" fill={fur} />
        <ellipse cx="40" cy="16" rx="4" ry="14" fill={inner} />
        <ellipse cx="80" cy="16" rx="4" ry="14" fill={inner} />
        <Round fill={fur} />
      </>
    );
  }
  if (kind === "axolotl") {
    return (
      <>
        <path d="M18 44 Q4 28 22 26 Q28 40 34 46" fill="#fb7185" />
        <path d="M18 58 Q2 58 18 72" fill="#fb7185" />
        <path d="M18 70 Q8 86 28 80" fill="#fb7185" />
        <path d="M102 44 Q116 28 98 26 Q92 40 86 46" fill="#fb7185" />
        <path d="M102 58 Q118 58 102 72" fill="#fb7185" />
        <path d="M102 70 Q112 86 92 80" fill="#fb7185" />
        <Round fill={fur} />
      </>
    );
  }
  if (kind === "bear") {
    return (
      <>
        <circle cx="32" cy="32" r="14" fill={fur} />
        <circle cx="88" cy="32" r="14" fill={fur} />
        <circle cx="32" cy="32" r="7" fill={inner} />
        <circle cx="88" cy="32" r="7" fill={inner} />
        <Round fill={fur} />
        <ellipse cx="60" cy="80" rx="14" ry="10" fill={inner} />
      </>
    );
  }
  if (kind === "lamb") {
    return (
      <>
        <circle cx="28" cy="36" r="16" fill={fur} />
        <circle cx="92" cy="36" r="16" fill={fur} />
        <circle cx="22" cy="62" r="14" fill={fur} />
        <circle cx="98" cy="62" r="14" fill={fur} />
        <Round fill={fur} />
        <ellipse cx="60" cy="80" rx="14" ry="10" fill={inner} />
      </>
    );
  }
  if (kind === "otter") {
    return (
      <>
        <Round fill={fur} />
        <ellipse cx="60" cy="82" rx="16" ry="12" fill={inner} />
        <path d="M30 72 L18 78" stroke="#1f2937" strokeWidth="2" />
        <path d="M30 78 L16 80" stroke="#1f2937" strokeWidth="2" />
        <path d="M90 72 L102 78" stroke="#1f2937" strokeWidth="2" />
        <path d="M90 78 L104 80" stroke="#1f2937" strokeWidth="2" />
      </>
    );
  }
  if (kind === "chick") {
    return (
      <>
        <polygon points="60,10 72,28 48,28" fill="#fb923c" />
        <Round fill={fur} />
        <ellipse cx="60" cy="84" rx="8" ry="5" fill="#fb923c" />
      </>
    );
  }
  if (kind === "duck") {
    return (
      <>
        <Round fill={fur} />
        <ellipse cx="60" cy="86" rx="16" ry="8" fill="#fb923c" />
        <ellipse cx="84" cy="78" rx="14" ry="7" fill="#fb923c" />
      </>
    );
  }
  if (kind === "frog") {
    return (
      <>
        <circle cx="36" cy="40" r="16" fill={fur} />
        <circle cx="84" cy="40" r="16" fill={fur} />
        <Round fill={fur} />
        <circle cx="36" cy="40" r="7" fill="#fff" />
        <circle cx="84" cy="40" r="7" fill="#fff" />
      </>
    );
  }
  if (kind === "fox") {
    return (
      <>
        <polygon points="20,44 36,12 50,40" fill={fur} />
        <polygon points="100,44 84,12 70,40" fill={fur} />
        <polygon points="28,40 36,22 44,40" fill="#f8fafc" />
        <polygon points="92,40 84,22 76,40" fill="#f8fafc" />
        <Round fill={fur} />
        <ellipse cx="60" cy="82" rx="12" ry="8" fill="#fff7ed" />
      </>
    );
  }
  if (kind === "peach") {
    return (
      <>
        <Round fill={fur} />
        <ellipse cx="60" cy="22" rx="16" ry="8" fill="#86efac" />
        <path d="M60 18 Q72 6 80 16" stroke="#4ade80" strokeWidth="4" fill="none" />
      </>
    );
  }
  if (kind === "panda") {
    return (
      <>
        <circle cx="32" cy="34" r="13" fill="#0f172a" />
        <circle cx="88" cy="34" r="13" fill="#0f172a" />
        <Round fill={fur} />
        <ellipse cx="46" cy="58" rx="12" ry="10" fill="#0f172a" />
        <ellipse cx="74" cy="58" rx="12" ry="10" fill="#0f172a" />
      </>
    );
  }
  if (kind === "penguin") {
    return (
      <>
        <Round fill={fur} />
        <ellipse cx="60" cy="78" rx="28" ry="30" fill={inner} />
        <polygon points="18,70 8,86 28,82" fill="#fb923c" />
        <polygon points="102,70 112,86 92,82" fill="#fb923c" />
        <ellipse cx="60" cy="86" rx="10" ry="6" fill="#fb923c" />
      </>
    );
  }
  if (kind === "dino") {
    return (
      <>
        <polygon points="48,8 60,28 36,28" fill={inner} />
        <polygon points="68,6 78,26 56,24" fill={inner} />
        <Round fill={fur} />
        <circle cx="98" cy="70" r="10" fill={fur} />
      </>
    );
  }
  if (kind === "unicorn") {
    return (
      <>
        <polygon points="60,2 68,32 52,32" fill="#fde047" />
        <ellipse cx="38" cy="16" rx="8" ry="18" fill={fur} />
        <ellipse cx="82" cy="16" rx="8" ry="18" fill={fur} />
        <Round fill={fur} />
      </>
    );
  }
  if (kind === "dragon") {
    return (
      <>
        <polygon points="24,36 36,8 48,40" fill={fur} />
        <polygon points="96,36 84,8 72,40" fill={fur} />
        <Round fill={fur} />
        <polygon points="96,64 118,58 100,78" fill="#fb7185" />
      </>
    );
  }
  if (kind === "bee") {
    return (
      <>
        <ellipse cx="28" cy="50" rx="16" ry="10" fill="#e0f2fe" opacity="0.9" />
        <ellipse cx="92" cy="50" rx="16" ry="10" fill="#e0f2fe" opacity="0.9" />
        <Round fill={fur} />
        <rect x="20" y="44" width="80" height="10" fill={inner} />
        <rect x="20" y="68" width="80" height="10" fill={inner} />
      </>
    );
  }
  if (kind === "whale") {
    return (
      <>
        <path d="M88 18 Q110 8 112 32 Q96 28 88 36" fill={fur} />
        <Round fill={fur} />
        <ellipse cx="60" cy="92" rx="30" ry="14" fill={inner} />
        <circle cx="24" cy="78" r="5" fill="#38bdf8" />
      </>
    );
  }
  if (kind === "hamster") {
    return (
      <>
        <circle cx="28" cy="70" r="16" fill={fur} />
        <circle cx="92" cy="70" r="16" fill={fur} />
        <Round fill={fur} />
        <ellipse cx="60" cy="80" rx="12" ry="8" fill={inner} />
      </>
    );
  }
  if (kind === "seal") {
    return (
      <>
        <Round fill={fur} />
        <ellipse cx="18" cy="86" rx="10" ry="7" fill={fur} />
        <ellipse cx="102" cy="86" rx="10" ry="7" fill={fur} />
        <ellipse cx="60" cy="88" rx="8" ry="6" fill="#1f2937" />
      </>
    );
  }
  if (kind === "koala") {
    return (
      <>
        <circle cx="24" cy="36" r="20" fill={fur} />
        <circle cx="96" cy="36" r="20" fill={fur} />
        <circle cx="24" cy="36" r="10" fill="#fda4af" />
        <circle cx="96" cy="36" r="10" fill="#fda4af" />
        <Round fill={fur} />
        <ellipse cx="60" cy="80" rx="12" ry="8" fill="#1f2937" />
      </>
    );
  }
  if (kind === "pig") {
    return (
      <>
        <ellipse cx="28" cy="28" rx="10" ry="14" fill={fur} />
        <ellipse cx="92" cy="28" rx="10" ry="14" fill={fur} />
        <Round fill={fur} />
        <ellipse cx="60" cy="82" rx="16" ry="11" fill={inner} />
        <circle cx="54" cy="82" r="3" fill="#fb7185" />
        <circle cx="66" cy="82" r="3" fill="#fb7185" />
      </>
    );
  }
  if (kind === "berry") {
    return (
      <>
        <Round fill={fur} />
        <circle cx="40" cy="40" r="4" fill="#fff" opacity="0.7" />
        <circle cx="70" cy="34" r="3.5" fill="#fff" opacity="0.55" />
        <circle cx="52" cy="92" r="3" fill="#9f1239" opacity="0.35" />
        <circle cx="80" cy="88" r="3" fill="#9f1239" opacity="0.35" />
      </>
    );
  }
  if (kind === "cupcake") {
    return (
      <>
        <path d="M28 70 L36 110 L84 110 L92 70 Z" fill="#fdba74" />
        <path d="M40 110 L44 70 M60 110 L60 70 M80 110 L76 70" stroke="#f59e0b" strokeWidth="3" />
        <circle cx="60" cy="52" r="40" fill={fur} />
        <circle cx="44" cy="44" r="8" fill="#fff" />
        <circle cx="74" cy="38" r="6" fill="#fb7185" />
      </>
    );
  }
  if (kind === "bun") {
    return (
      <>
        <Round fill={fur} />
        <path d="M36 18 Q60 4 84 18" stroke="#fdba74" strokeWidth="4" fill="none" />
      </>
    );
  }
  if (kind === "onigiri") {
    return (
      <>
        <path d="M60 8 L112 100 L8 100 Z" fill={fur} />
        <rect x="42" y="78" width="36" height="28" rx="6" fill={inner} />
      </>
    );
  }
  if (kind === "ramen") {
    return (
      <>
        <ellipse cx="60" cy="78" rx="50" ry="28" fill="#f97316" />
        <ellipse cx="60" cy="58" rx="44" ry="22" fill="#fef3c7" />
        <path d="M30 52 Q50 40 70 54 Q86 64 96 52" stroke="#fdba74" strokeWidth="5" fill="none" />
        <ellipse cx="78" cy="58" rx="12" ry="8" fill="#fef9c3" />
        <ellipse cx="78" cy="58" rx="7" ry="5" fill="#f97316" />
      </>
    );
  }
  if (kind === "melon") {
    return (
      <>
        <Round fill={fur} />
        <path d="M20 40 Q60 20 100 40" stroke="#16a34a" strokeWidth="5" fill="none" />
        <path d="M18 70 Q60 50 102 70" stroke="#16a34a" strokeWidth="5" fill="none" />
        <ellipse cx="60" cy="86" rx="22" ry="14" fill={inner} />
      </>
    );
  }
  if (kind === "boba") {
    return (
      <>
        <rect x="28" y="28" width="64" height="80" rx="16" fill={fur} />
        <rect x="22" y="20" width="76" height="16" rx="8" fill="#ddd6fe" />
        <rect x="56" y="4" width="8" height="22" rx="4" fill="#a78bfa" />
        <circle cx="44" cy="90" r="6" fill={inner} />
        <circle cx="62" cy="96" r="6" fill={inner} />
        <circle cx="78" cy="88" r="6" fill={inner} />
      </>
    );
  }
  if (kind === "mushroom") {
    return (
      <>
        <ellipse cx="60" cy="44" rx="50" ry="32" fill={fur} />
        <circle cx="40" cy="36" r="8" fill="#fff" />
        <circle cx="72" cy="28" r="6" fill="#fff" />
        <circle cx="86" cy="44" r="7" fill="#fff" />
        <rect x="38" y="58" width="44" height="48" rx="16" fill={inner} />
      </>
    );
  }
  if (kind === "star") {
    return <polygon points="60,6 72,42 110,42 80,66 92,108 60,84 28,108 40,66 10,42 48,42" fill={fur} />;
  }
  if (kind === "moon") {
    return (
      <>
        <circle cx="60" cy="60" r="54" fill={fur} />
        <circle cx="78" cy="46" r="40" fill="#1c160c" opacity="0.18" />
      </>
    );
  }
  if (kind === "ghost") {
    return (
      <path
        d="M24 56 Q24 16 60 16 Q96 16 96 56 L96 104 Q86 92 76 104 Q66 92 60 104 Q54 92 44 104 Q34 92 24 104 Z"
        fill={fur}
      />
    );
  }
  if (kind === "clover") {
    return (
      <>
        <circle cx="40" cy="46" r="22" fill={fur} />
        <circle cx="80" cy="46" r="22" fill={fur} />
        <circle cx="60" cy="72" r="22" fill={fur} />
        <circle cx="60" cy="60" r="28" fill={fur} />
      </>
    );
  }
  if (kind === "cloud") {
    return (
      <>
        <circle cx="38" cy="64" r="28" fill={fur} />
        <circle cx="82" cy="64" r="28" fill={fur} />
        <circle cx="60" cy="46" r="30" fill={fur} />
        <ellipse cx="60" cy="78" rx="46" ry="24" fill={fur} />
      </>
    );
  }
  if (kind === "sunflower") {
    return (
      <>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <ellipse key={i} cx={60 + Math.cos(a) * 42} cy={60 + Math.sin(a) * 42} rx="12" ry="20" fill={fur} transform={`rotate(${(a * 180) / Math.PI} ${60 + Math.cos(a) * 42} ${60 + Math.sin(a) * 42})`} />;
        })}
        <circle cx="60" cy="60" r="32" fill="#78350f" />
      </>
    );
  }
  if (kind === "lemon") {
    return (
      <>
        <ellipse cx="60" cy="60" rx="46" ry="54" fill={fur} />
        <ellipse cx="60" cy="60" rx="30" ry="36" fill={inner} />
      </>
    );
  }
  if (kind === "donut") {
    return (
      <>
        <circle cx="60" cy="60" r="54" fill={inner} />
        <circle cx="60" cy="60" r="54" fill={fur} fillOpacity="0.92" />
        <circle cx="42" cy="40" r="5" fill="#fb7185" />
        <circle cx="78" cy="36" r="4" fill="#38bdf8" />
        <circle cx="88" cy="62" r="5" fill="#facc15" />
        <circle cx="60" cy="60" r="16" fill="#fff7ed" />
      </>
    );
  }
  if (kind === "waffle") {
    return (
      <>
        <rect x="16" y="16" width="88" height="88" rx="18" fill={fur} />
        <path d="M16 45 H104 M16 74 H104 M45 16 V104 M74 16 V104" stroke="#b45309" strokeWidth="4" />
      </>
    );
  }
  if (kind === "toast") {
    return (
      <>
        <rect x="18" y="28" width="84" height="76" rx="16" fill={fur} />
        <circle cx="36" cy="28" r="18" fill={fur} />
        <circle cx="84" cy="28" r="18" fill={fur} />
        <rect x="30" y="44" width="60" height="48" rx="8" fill={inner} />
      </>
    );
  }
  if (kind === "dango") {
    return (
      <>
        <rect x="58" y="6" width="6" height="108" rx="3" fill="#a8a29e" />
        <circle cx="60" cy="28" r="20" fill="#86efac" />
        <circle cx="60" cy="60" r="20" fill={fur} />
        <circle cx="60" cy="92" r="20" fill="#fde68a" />
      </>
    );
  }
  if (kind === "taiyaki") {
    return (
      <>
        <ellipse cx="58" cy="60" rx="46" ry="34" fill={fur} />
        <polygon points="96,48 118,60 96,72" fill={fur} />
        <circle cx="40" cy="54" r="6" fill={inner} />
        <circle cx="62" cy="54" r="6" fill={inner} />
      </>
    );
  }
  if (kind === "dumpling") {
    return (
      <>
        <ellipse cx="60" cy="64" rx="48" ry="36" fill={fur} />
        <path d="M24 56 Q36 40 48 56 Q60 40 72 56 Q84 40 96 56" stroke="#d97706" strokeWidth="4" fill="none" />
      </>
    );
  }
  if (kind === "cookie") {
    return (
      <>
        <circle cx="60" cy="60" r="54" fill={fur} />
        <circle cx="42" cy="44" r="6" fill="#78350f" />
        <circle cx="74" cy="40" r="5" fill="#78350f" />
        <circle cx="86" cy="70" r="6" fill="#78350f" />
        <circle cx="50" cy="84" r="5" fill="#78350f" />
        <circle cx="64" cy="62" r="5" fill="#78350f" />
      </>
    );
  }
  if (kind === "milk") {
    return (
      <>
        <rect x="32" y="28" width="56" height="80" rx="10" fill={fur} />
        <rect x="28" y="18" width="64" height="18" rx="6" fill="#cbd5e1" />
        <rect x="40" y="4" width="40" height="18" rx="6" fill="#94a3b8" />
      </>
    );
  }
  return (
    <Round fill={fur}>
      <ellipse cx="60" cy="80" rx="12" ry="8" fill={inner} />
    </Round>
  );
}

function ExtraMark({ extra, color }: { extra?: AvatarDef["extra"]; color: string }) {
  if (extra === "bow") {
    return (
      <>
        <ellipse cx="48" cy="18" rx="8" ry="6" fill={color} />
        <ellipse cx="64" cy="18" rx="8" ry="6" fill={color} />
        <circle cx="56" cy="18" r="4" fill="#fff" />
      </>
    );
  }
  if (extra === "star") {
    return <polygon points="96,22 100,32 110,34 102,42 104,52 96,46 88,52 90,42 82,34 92,32" fill="#fde047" />;
  }
  if (extra === "sprout") {
    return (
      <>
        <path d="M60 10 Q50 0 44 10" stroke="#4ade80" strokeWidth="4" fill="none" />
        <circle cx="44" cy="10" r="6" fill="#86efac" />
      </>
    );
  }
  if (extra === "horn") {
    return null;
  }
  if (extra === "leaf") {
    return <ellipse cx="86" cy="18" rx="10" ry="6" fill="#4ade80" transform="rotate(-20 86 18)" />;
  }
  return null;
}
