/** Nyx is a product rail. Do not delete the instructor, courses, or /course routes. */
const V = 7;

export const NYX = {
  id: "nyx",
  name: "Nyx",
  fullName: "Nyx Vale",
  ageLabel: "adult, late 20s",
  role: "Stage and class instructor",
  look: "Photoreal 85mm studio stills of the same adult woman: porcelain skin, long jet-black hair, blunt bangs, heavy smoky eyes, winged liner, matte black lipstick, silver septum. Alluring, sexy, body-conscious posing in high-waisted black yoga pants. Editorial plates are those photographs with stage-lab type. Fictional adult instructor, late 20s.",
  voice: {
    nameHints: ["Aria", "Jenny", "Ava", "Samantha", "Zira", "Female", "Woman"],
    rate: 0.82,
    pitch: 0.86,
    edgeVoice: "en-US-AriaNeural",
    edgeRate: "-12%",
    edgePitch: "-6Hz",
  },
  portrait: `/instructor/nyx-portrait.webp?v=${V}`,
  plates: {
    portrait: `/instructor/plates/nyx-plate-portrait.webp?v=${V}`,
    walk: `/instructor/plates/nyx-plate-walk.webp?v=${V}`,
    wave: `/instructor/plates/nyx-plate-wave.webp?v=${V}`,
    floor: `/instructor/plates/nyx-plate-floor.webp?v=${V}`,
    chair: `/instructor/plates/nyx-plate-chair.webp?v=${V}`,
    sit: `/instructor/plates/nyx-plate-sit.webp?v=${V}`,
    pole: `/instructor/plates/nyx-plate-pole.webp?v=${V}`,
    hang: `/instructor/plates/nyx-plate-hang.webp?v=${V}`,
    climb: `/instructor/plates/nyx-plate-climb.webp?v=${V}`,
    heels: `/instructor/plates/nyx-plate-heels.webp?v=${V}`,
    hands: `/instructor/plates/nyx-plate-hands.webp?v=${V}`,
    mermaid: `/instructor/plates/nyx-plate-mermaid.webp?v=${V}`,
    fireman: `/instructor/plates/nyx-plate-fireman.webp?v=${V}`,
    kick: `/instructor/plates/nyx-plate-kick.webp?v=${V}`,
    grind: `/instructor/plates/nyx-plate-grind.webp?v=${V}`,
    crawl: `/instructor/plates/nyx-plate-crawl.webp?v=${V}`,
    peel: `/instructor/plates/nyx-plate-peel.webp?v=${V}`,
    turn: `/instructor/plates/nyx-plate-turn.webp?v=${V}`,
  },
  photos: {
    portrait: `/instructor/nyx-portrait.webp?v=${V}`,
    walk: `/instructor/nyx-walk.webp?v=${V}`,
    wave: `/instructor/nyx-wave.webp?v=${V}`,
    chair: `/instructor/nyx-chair.webp?v=${V}`,
    sit: `/instructor/nyx-sit.webp?v=${V}`,
    pole: `/instructor/nyx-pole.webp?v=${V}`,
    hang: `/instructor/nyx-hang.webp?v=${V}`,
    floor: `/instructor/nyx-floor.webp?v=${V}`,
    climb: `/instructor/nyx-climb.webp?v=${V}`,
    heels: `/instructor/nyx-heels.webp?v=${V}`,
    hands: `/instructor/nyx-hands.webp?v=${V}`,
    mermaid: `/instructor/nyx-mermaid.webp?v=${V}`,
    fireman: `/instructor/nyx-fireman.webp?v=${V}`,
    kick: `/instructor/nyx-kick.webp?v=${V}`,
    grind: `/instructor/nyx-grind.webp?v=${V}`,
    crawl: `/instructor/nyx-crawl.webp?v=${V}`,
    peel: `/instructor/nyx-peel.webp?v=${V}`,
    turn: `/instructor/nyx-turn.webp?v=${V}`,
  },
} as const;

export type NyxStill = keyof typeof NYX.photos;
type NyxPlate = keyof typeof NYX.plates;

export const NYX_GALLERY: NyxStill[] = [
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
