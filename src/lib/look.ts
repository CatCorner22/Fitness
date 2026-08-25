export const PALETTES = [
  { id: "copper", label: "Copper", hint: "Warm charcoal" },
  { id: "sakura", label: "Sakura", hint: "Pink blossom" },
  { id: "matcha", label: "Matcha", hint: "Green tea" },
  { id: "grape", label: "Grape", hint: "Violet night" },
  { id: "ocean", label: "Ocean", hint: "Teal water" },
  { id: "peach", label: "Peach", hint: "Sunset coral" },
  { id: "candy", label: "Candy", hint: "Bubblegum" },
  { id: "honey", label: "Honey", hint: "Gold and cream" },
  { id: "lavender", label: "Lavender", hint: "Soft lilac" },
  { id: "mint", label: "Mint", hint: "Cool cream" },
] as const;

export const TYPE_SIZES = [
  { id: "sm", label: "Small" },
  { id: "md", label: "Medium" },
  { id: "lg", label: "Large" },
  { id: "xl", label: "Huge" },
] as const;

export const FONTS = [
  { id: "outfit", label: "Outfit", sample: "Clean gym" },
  { id: "nunito", label: "Nunito", sample: "Soft round" },
  { id: "fredoka", label: "Fredoka", sample: "Kawaii" },
  { id: "comfortaa", label: "Comfortaa", sample: "Bubble cute" },
  { id: "quicksand", label: "Quicksand", sample: "Light bubble" },
  { id: "fraunces", label: "Fraunces", sample: "Fancy" },
  { id: "mono", label: "Mono", sample: "Logbook" },
] as const;

export const ACCENTS = [
  { id: "none", label: "Plain" },
  { id: "sparkles", label: "Sparkles" },
  { id: "hearts", label: "Hearts" },
  { id: "stars", label: "Stars" },
  { id: "dots", label: "Polka" },
  { id: "glow", label: "Glow" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];
export type TypeSizeId = (typeof TYPE_SIZES)[number]["id"];
export type FontId = (typeof FONTS)[number]["id"];
export type AccentId = (typeof ACCENTS)[number]["id"];

export type AvatarKind =
  | "cat"
  | "calico"
  | "bunny"
  | "bear"
  | "chick"
  | "frog"
  | "fox"
  | "blob"
  | "peach"
  | "panda"
  | "dino"
  | "bee"
  | "whale"
  | "mushroom"
  | "cupcake"
  | "bun"
  | "onigiri"
  | "penguin"
  | "otter"
  | "axolotl"
  | "lamb"
  | "berry"
  | "star"
  | "moon"
  | "ghost"
  | "clover"
  | "ramen"
  | "melon"
  | "boba"
  | "hamster"
  | "seal"
  | "koala"
  | "pig"
  | "duck"
  | "unicorn"
  | "dragon"
  | "cloud"
  | "donut"
  | "waffle"
  | "toast"
  | "dango"
  | "taiyaki"
  | "dumpling"
  | "sunflower"
  | "lemon"
  | "cookie"
  | "milk";

export type AvatarDef = {
  id: string;
  name: string;
  kind: AvatarKind;
  fur: string;
  inner: string;
  blush: string;
  extra?: "bow" | "star" | "sprout" | "horn" | "leaf";
};

export const AVATARS: AvatarDef[] = [
  { id: "peach", name: "Momo", kind: "peach", fur: "#ffb7c5", inner: "#ffe4ec", blush: "#ff6b9a" },
  { id: "kitty", name: "Neko", kind: "cat", fur: "#f4c7b0", inner: "#f9e0d2", blush: "#f472b6" },
  { id: "calico", name: "Mike", kind: "calico", fur: "#fff7ed", inner: "#fdba74", blush: "#fb7185" },
  { id: "kuro", name: "Kuro", kind: "cat", fur: "#1f2937", inner: "#f9a8d4", blush: "#fb7185" },
  { id: "latte", name: "Latte", kind: "cat", fur: "#e7c9a9", inner: "#fff7ed", blush: "#fb923c" },
  { id: "bunny", name: "Usagi", kind: "bunny", fur: "#f8e1f4", inner: "#fff0fb", blush: "#f9a8d4", extra: "bow" },
  { id: "sakura", name: "Sakura", kind: "bunny", fur: "#fbcfe8", inner: "#fdf2f8", blush: "#ec4899", extra: "bow" },
  { id: "axolotl", name: "Upari", kind: "axolotl", fur: "#fda4af", inner: "#ffe4e6", blush: "#fb7185" },
  { id: "bear", name: "Kuma", kind: "bear", fur: "#c4a484", inner: "#ead7c3", blush: "#fb7185" },
  { id: "otter", name: "Kawauso", kind: "otter", fur: "#d6b48f", inner: "#f5e6d3", blush: "#fb923c" },
  { id: "lamb", name: "Hitsuji", kind: "lamb", fur: "#f8fafc", inner: "#e2e8f0", blush: "#f9a8d4" },
  { id: "sesame", name: "Goma", kind: "bear", fur: "#78716c", inner: "#d6d3d1", blush: "#fda4af" },
  { id: "chick", name: "Piyo", kind: "chick", fur: "#ffe566", inner: "#fff4b0", blush: "#fb923c" },
  { id: "duck", name: "Ahiru", kind: "duck", fur: "#fde047", inner: "#fff7ed", blush: "#fb923c" },
  { id: "penguin", name: "Pengi", kind: "penguin", fur: "#1e293b", inner: "#f8fafc", blush: "#fb7185" },
  { id: "frog", name: "Kaeru", kind: "frog", fur: "#86efac", inner: "#dcfce7", blush: "#f472b6" },
  { id: "fox", name: "Kitsune", kind: "fox", fur: "#fdba74", inner: "#ffedd5", blush: "#fb7185" },
  { id: "panda", name: "Panda", kind: "panda", fur: "#f8fafc", inner: "#e2e8f0", blush: "#fda4af" },
  { id: "dino", name: "Dino", kind: "dino", fur: "#6ee7b7", inner: "#d1fae5", blush: "#f9a8d4", extra: "horn" },
  { id: "unicorn", name: "Yuni", kind: "unicorn", fur: "#f5d0fe", inner: "#fae8ff", blush: "#e879f9", extra: "horn" },
  { id: "dragon", name: "Ryu", kind: "dragon", fur: "#86efac", inner: "#bbf7d0", blush: "#f472b6" },
  { id: "bee", name: "Hachi", kind: "bee", fur: "#facc15", inner: "#1f2937", blush: "#fb923c" },
  { id: "whale", name: "Kujira", kind: "whale", fur: "#7dd3fc", inner: "#e0f2fe", blush: "#f9a8d4" },
  { id: "hamster", name: "Hamu", kind: "hamster", fur: "#fdba74", inner: "#ffedd5", blush: "#fb7185" },
  { id: "seal", name: "Azarashi", kind: "seal", fur: "#cbd5e1", inner: "#f8fafc", blush: "#fda4af" },
  { id: "koala", name: "Koala", kind: "koala", fur: "#d6d3d1", inner: "#f5f5f4", blush: "#fda4af" },
  { id: "pig", name: "Buta", kind: "pig", fur: "#fecdd3", inner: "#ffe4e6", blush: "#fb7185" },
  { id: "berry", name: "Ichigo", kind: "berry", fur: "#fb7185", inner: "#fecdd3", blush: "#be123c", extra: "leaf" },
  { id: "mochi", name: "Mochi", kind: "blob", fur: "#fecdd3", inner: "#fff1f2", blush: "#fb7185" },
  { id: "puff", name: "Mallow", kind: "blob", fur: "#fff1f2", inner: "#ffe4e6", blush: "#f9a8d4" },
  { id: "cupcake", name: "Cupcake", kind: "cupcake", fur: "#fbcfe8", inner: "#fff7ed", blush: "#fb7185", extra: "bow" },
  { id: "bun", name: "Manju", kind: "bun", fur: "#fde68a", inner: "#fffbeb", blush: "#fdba74" },
  { id: "onigiri", name: "Onigiri", kind: "onigiri", fur: "#f1f5f9", inner: "#334155", blush: "#fda4af" },
  { id: "ramen", name: "Ramen", kind: "ramen", fur: "#fdba74", inner: "#ffedd5", blush: "#fb7185" },
  { id: "melon", name: "Melon", kind: "melon", fur: "#86efac", inner: "#fef08a", blush: "#fb7185" },
  { id: "taro", name: "Taro", kind: "blob", fur: "#d8b4fe", inner: "#f3e8ff", blush: "#e879f9" },
  { id: "boba", name: "Boba", kind: "boba", fur: "#c4b5fd", inner: "#1e1b4b", blush: "#f9a8d4" },
  { id: "donut", name: "Donut", kind: "donut", fur: "#fbcfe8", inner: "#fdba74", blush: "#fb7185" },
  { id: "waffle", name: "Waffle", kind: "waffle", fur: "#fbbf24", inner: "#fff7ed", blush: "#fb923c" },
  { id: "toast", name: "Toast", kind: "toast", fur: "#f5d0a9", inner: "#fff7ed", blush: "#fb923c" },
  { id: "dango", name: "Dango", kind: "dango", fur: "#fda4af", inner: "#fde68a", blush: "#fb7185" },
  { id: "taiyaki", name: "Taiyaki", kind: "taiyaki", fur: "#fdba74", inner: "#78350f", blush: "#fb7185" },
  { id: "dumpling", name: "Gyoza", kind: "dumpling", fur: "#fde68a", inner: "#fffbeb", blush: "#fdba74" },
  { id: "cookie", name: "Cookie", kind: "cookie", fur: "#d97706", inner: "#fef3c7", blush: "#fb923c" },
  { id: "milk", name: "Milk", kind: "milk", fur: "#f8fafc", inner: "#e2e8f0", blush: "#fda4af" },
  { id: "mushroom", name: "Kinoko", kind: "mushroom", fur: "#fecaca", inner: "#fff7ed", blush: "#fb7185", extra: "sprout" },
  { id: "star", name: "Hoshi", kind: "star", fur: "#fde047", inner: "#fef9c3", blush: "#fb923c", extra: "star" },
  { id: "moon", name: "Tsuki", kind: "moon", fur: "#fef3c7", inner: "#fde68a", blush: "#fdba74" },
  { id: "ghost", name: "Obake", kind: "ghost", fur: "#e0e7ff", inner: "#c7d2fe", blush: "#c4b5fd" },
  { id: "clover", name: "Clover", kind: "clover", fur: "#4ade80", inner: "#dcfce7", blush: "#f9a8d4", extra: "leaf" },
  { id: "cloud", name: "Kumo", kind: "cloud", fur: "#e0f2fe", inner: "#f8fafc", blush: "#f9a8d4" },
  { id: "sunflower", name: "Himawari", kind: "sunflower", fur: "#facc15", inner: "#fef9c3", blush: "#fb923c" },
  { id: "lemon", name: "Lemon", kind: "lemon", fur: "#fde047", inner: "#fefce8", blush: "#fb923c", extra: "leaf" },
];

export const AVATAR_GROUPS = [
  {
    id: "friends",
    label: "Friends",
    ids: [
      "kitty",
      "calico",
      "kuro",
      "latte",
      "bunny",
      "sakura",
      "axolotl",
      "bear",
      "otter",
      "lamb",
      "sesame",
      "chick",
      "duck",
      "penguin",
      "frog",
      "fox",
      "panda",
      "dino",
      "unicorn",
      "dragon",
      "bee",
      "whale",
      "hamster",
      "seal",
      "koala",
      "pig",
    ],
  },
  {
    id: "snacks",
    label: "Snacks",
    ids: [
      "peach",
      "berry",
      "mochi",
      "puff",
      "cupcake",
      "bun",
      "onigiri",
      "ramen",
      "melon",
      "taro",
      "boba",
      "donut",
      "waffle",
      "toast",
      "dango",
      "taiyaki",
      "dumpling",
      "cookie",
      "milk",
    ],
  },
  {
    id: "magic",
    label: "Magic",
    ids: ["mushroom", "star", "moon", "ghost", "clover", "cloud", "sunflower", "lemon"],
  },
] as const;

export type LookPrefs = {
  palette: PaletteId;
  size: TypeSizeId;
  font: FontId;
  accent: AccentId;
  avatar: string;
};

export const DEFAULT_LOOK: LookPrefs = {
  palette: "copper",
  size: "md",
  font: "outfit",
  accent: "none",
  avatar: "peach",
};

function inList<T extends string>(value: string, list: readonly { id: T }[]): value is T {
  return list.some((item) => item.id === value);
}

export function parseLook(raw?: string | null): LookPrefs {
  if (!raw) return DEFAULT_LOOK;
  try {
    const data = JSON.parse(raw) as Partial<LookPrefs>;
    return {
      palette: data.palette && inList(data.palette, PALETTES) ? data.palette : DEFAULT_LOOK.palette,
      size: data.size && inList(data.size, TYPE_SIZES) ? data.size : DEFAULT_LOOK.size,
      font: data.font && inList(data.font, FONTS) ? data.font : DEFAULT_LOOK.font,
      accent: data.accent && inList(data.accent, ACCENTS) ? data.accent : DEFAULT_LOOK.accent,
      avatar: AVATARS.some((a) => a.id === data.avatar) ? (data.avatar as string) : DEFAULT_LOOK.avatar,
    };
  } catch {
    return DEFAULT_LOOK;
  }
}

export function avatarById(id: string) {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export const PALETTE_THEME_COLORS: Record<PaletteId, { dark: string; light: string }> = {
  copper: { dark: "#14110d", light: "#f7f1e6" },
  sakura: { dark: "#2a1520", light: "#fff1f5" },
  matcha: { dark: "#142018", light: "#f3f7ea" },
  grape: { dark: "#1a1428", light: "#f5f0ff" },
  ocean: { dark: "#0f1c24", light: "#eef8fb" },
  peach: { dark: "#241814", light: "#fff4ec" },
  candy: { dark: "#1f1530", light: "#fff0fb" },
  honey: { dark: "#1c160c", light: "#fff8e8" },
  lavender: { dark: "#1c1730", light: "#f6f3ff" },
  mint: { dark: "#10241f", light: "#ecfdf5" },
};

export const LOOK_PREVIEW_EVENT = "garanimal-look-preview";

const groupedAvatarIds = AVATAR_GROUPS.flatMap((group) => [...group.ids]);
if (new Set(groupedAvatarIds).size !== AVATARS.length || groupedAvatarIds.length !== AVATARS.length) {
  throw new Error("AVATAR_GROUPS must list each avatar exactly once");
}
