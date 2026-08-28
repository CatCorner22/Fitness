/** Nyx is a product rail. Do not delete the instructor, courses, or /course routes. */
const V = 8;

function photo(key: string) {
  return `/instructor/nyx-${key}.webp?v=${V}`;
}
function plate(key: string) {
  return `/instructor/plates/nyx-plate-${key}.webp?v=${V}`;
}

const STILL_KEYS = [
  "portrait",
  "walk",
  "wave",
  "chair",
  "sit",
  "pole",
  "hang",
  "floor",
  "climb",
  "heels",
  "hands",
  "mermaid",
  "fireman",
  "kick",
  "grind",
  "crawl",
  "peel",
  "turn",
  "nuda",
  "nudb",
  "nudc",
  "ncha",
  "nchb",
  "nchd",
  "nrea",
  "nreb",
  "nrec",
  "npla",
  "nplb",
  "nplc",
  "ntpa",
  "ntpb",
  "ntpc",
  "nhea",
  "nheb",
  "nhec",
] as const;

export const NYX = {
  id: "nyx",
  name: "Nyx",
  fullName: "Nyx Vale",
  ageLabel: "adult, late 20s",
  role: "Stage and class instructor",
  look: "Photoreal 85mm studio stills of the same adult woman: porcelain skin, long jet-black hair, blunt bangs, heavy smoky eyes, winged liner, matte black lipstick, silver septum, dark bird chest tattoo. Stage wardrobe includes sports-bra and yoga-pants looks plus adult nude and topless sets — several looks, several sets each. Editorial plates are those photographs with stage-lab type. Fictional adult instructor, late 20s.",
  voice: {
    nameHints: ["Aria", "Jenny", "Ava", "Samantha", "Zira", "Female", "Woman"],
    rate: 0.82,
    pitch: 0.86,
    edgeVoice: "en-US-AriaNeural",
    edgeRate: "-12%",
    edgePitch: "-6Hz",
  },
  portrait: photo("portrait"),
  plates: Object.fromEntries(STILL_KEYS.map((key) => [key, plate(key)])) as { [K in (typeof STILL_KEYS)[number]]: string },
  photos: Object.fromEntries(STILL_KEYS.map((key) => [key, photo(key)])) as { [K in (typeof STILL_KEYS)[number]]: string },
} as const;

export type NyxStill = (typeof STILL_KEYS)[number];
type NyxPlate = keyof typeof NYX.plates;

export const NYX_LOOKS: { id: string; label: string; sets: { key: NyxStill; label: string }[] }[] = [
  {
    id: "stand",
    label: "Standing nude",
    sets: [
      { key: "nuda", label: "Set A · hand in hair" },
      { key: "nudb", label: "Set B · walk" },
      { key: "nudc", label: "Set C · front" },
    ],
  },
  {
    id: "chair",
    label: "Chair nude",
    sets: [
      { key: "ncha", label: "Set A · seated" },
      { key: "nchb", label: "Set B · bench" },
      { key: "nchd", label: "Set C · close" },
    ],
  },
  {
    id: "floor",
    label: "Floor nude",
    sets: [
      { key: "nrea", label: "Set A · sit" },
      { key: "nreb", label: "Set B · mermaid" },
      { key: "nrec", label: "Set C · crawl" },
    ],
  },
  {
    id: "pole",
    label: "Pole nude",
    sets: [
      { key: "npla", label: "Set A · lean" },
      { key: "nplb", label: "Set B · high arm" },
      { key: "nplc", label: "Set C · climb" },
    ],
  },
  {
    id: "top",
    label: "Topless in pants",
    sets: [
      { key: "ntpa", label: "Set A · hip phrase" },
      { key: "ntpb", label: "Set B · standing" },
      { key: "ntpc", label: "Set C · heel walk" },
    ],
  },
  {
    id: "heels",
    label: "Heels nude",
    sets: [
      { key: "nhea", label: "Set A · walk" },
      { key: "nheb", label: "Set B · turn" },
      { key: "nhec", label: "Set C · close" },
    ],
  },
];

export const NYX_GALLERY: NyxStill[] = [
  "nuda",
  "nudb",
  "nudc",
  "ncha",
  "nchb",
  "nchd",
  "nrea",
  "nreb",
  "nrec",
  "npla",
  "nplb",
  "nplc",
  "ntpa",
  "ntpb",
  "ntpc",
  "nhea",
  "nheb",
  "nhec",
  "walk",
  "heels",
  "hands",
  "grind",
  "kick",
  "turn",
  "crawl",
  "mermaid",
  "peel",
  "chair",
  "wave",
  "floor",
  "pole",
  "fireman",
  "sit",
  "climb",
  "hang",
];

type KeysEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const _platesMatchPhotos: KeysEqual<NyxStill, NyxPlate> = true;
void _platesMatchPhotos;
