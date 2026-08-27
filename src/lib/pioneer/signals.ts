import type { PioneerKind } from "./types";

export type DraftSignals = {
  kind: PioneerKind;
  calories: number[];
  proteinGrams: number[];
  hasRpe: boolean;
  hasSetsReps: boolean;
  hasRestDay: boolean;
  hasSleep: boolean;
  trainingDays: number | null;
  sessionMinutes: number[];
  bannedLifts: string[];
  crashPhrases: string[];
  painPhrases: string[];
  medicalPhrases: string[];
  fastingHours: number[];
  waterCut: boolean;
  diuretic: boolean;
  juiceCleanse: boolean;
  trainThroughPain: boolean;
  mealSlots: string[];
  liftMentions: string[];
  wordCount: number;
  charCount: number;
};

const BANNED_LIFTS = [
  "bench dip",
  "chair dip",
  "bar dip",
  "parallel bar dip",
  "parallel-bar dip",
  "triceps dip",
  "tricep dip",
  "behind the neck press",
  "behind-the-neck press",
  "behind the neck pulldown",
  "behind-the-neck pulldown",
  "behind the neck",
  "upright row to the chin",
  "chin-height upright row",
  "upright row",
  "kipping pull-up",
  "kipping pullup",
  "kipping",
];

const CRASH_PHRASES = [
  "juice cleanse",
  "master cleanse",
  "cabbage soup diet",
  "starve",
  "starvation",
  "crash diet",
  "zero calorie",
  "0 calorie diet",
];

const PAIN_PHRASES = [
  "sharp pain",
  "hot pain",
  "numb",
  "radiating",
  "nerve zing",
  "joint pain",
];

const MEDICAL_PHRASES = [
  "diagnose",
  "diagnosis",
  "prescribe me",
  "what disease",
  "is this cancer",
  "treat my",
];

const LIFT_WORDS = [
  "squat",
  "bench",
  "deadlift",
  "rdl",
  "press",
  "row",
  "pull-up",
  "pullup",
  "hip thrust",
  "lunge",
  "ohp",
  "pole",
  "ruck",
  "climb",
  "hang",
];

const TRAIN_WORDS = [
  "workout",
  "session",
  "sets",
  "reps",
  "rpe",
  "lift",
  "training",
  "deload",
  "volume",
];

const FOOD_WORDS = [
  "kcal",
  "calorie",
  "protein",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "meal",
  "cut",
  "bulk",
  "fast",
  "carb",
];

function lower(text: string) {
  return text.toLowerCase();
}

export function mentionedAsPlan(text: string, phrase: string): boolean {
  const hay = lower(text);
  const needle = phrase.toLowerCase();
  let from = 0;
  while (from < hay.length) {
    const idx = hay.indexOf(needle, from);
    if (idx < 0) return false;
    const window = hay.slice(Math.max(0, idx - 28), idx + needle.length + 14);
    if (!/\b(no|not|avoid|skip|ban|banned|never|don't|dont|do not|instead of|against)\b/.test(window)) {
      return true;
    }
    from = idx + needle.length;
  }
  return false;
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values.filter((n) => Number.isFinite(n)))];
}

function countHits(hay: string, words: string[]) {
  return words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
}

export function inferKind(text: string): PioneerKind {
  const hay = lower(text);
  const t = countHits(hay, TRAIN_WORDS) + countHits(hay, LIFT_WORDS);
  const n = countHits(hay, FOOD_WORDS);
  if (t > 0 && n > 0) return "mixed";
  if (n > t) return "nutrition";
  if (t > 0) return "training";
  return "mixed";
}

export function parseDraftSignals(text: string, kindHint?: PioneerKind): DraftSignals {
  const hay = lower(text);
  const calories = uniqueNumbers(
    [...text.matchAll(/(\d{3,4})\s*(?:k?cal|calories)\b/gi)].map((m) => Number(m[1])),
  );
  const proteinGrams = uniqueNumbers(
    [
      ...text.matchAll(/\bprotein[:\s]+(\d{2,3})\s*g\b/gi),
      ...text.matchAll(/\b(\d{2,3})\s*g(?:rams?)?\s*(?:of\s+)?protein\b/gi),
    ].map((m) => Number(m[1])),
  );
  const sessionMinutes = uniqueNumbers(
    [...text.matchAll(/\b(\d{2,3})\s*(?:min|minutes)\b/gi)].map((m) => Number(m[1])),
  );
  const dayMatch = hay.match(/\b([1-7])\s*days?\s*(?:a|per|\/)\s*week\b/);
  const fastingHours = uniqueNumbers([
    ...[...text.matchAll(/\b(\d{1,2})\s*:\s*(\d)\b/g)].map((m) => Number(m[1])),
    ...[...text.matchAll(/\b(\d{2})\s*h(?:ours?)?\s*fast/gi)].map((m) => Number(m[1])),
    ...[...text.matchAll(/\bfast(?:ing)?\s*(?:for\s+)?(\d{2})\s*h/gi)].map((m) => Number(m[1])),
  ]).filter((h) => h >= 12 && h <= 48);

  const bannedLifts = BANNED_LIFTS.filter((p) => mentionedAsPlan(text, p));
  const crashPhrases = CRASH_PHRASES.filter((p) => hay.includes(p));
  const painPhrases = PAIN_PHRASES.filter((p) => hay.includes(p));
  const medicalPhrases = MEDICAL_PHRASES.filter((p) => hay.includes(p));
  const mealSlots = ["breakfast", "lunch", "dinner", "snack"].filter((m) => hay.includes(m));
  const liftMentions = LIFT_WORDS.filter((w) => hay.includes(w));

  const trainThroughPain =
    /\btrain through\b/.test(hay) ||
    /\bno pain no gain\b/.test(hay) ||
    /\bwork through (the )?(sharp|hot|numb|pain)\b/.test(hay) ||
    /\bpush through (the )?pain\b/.test(hay);

  const words = text.trim().split(/\s+/).filter(Boolean);

  return {
    kind: kindHint ?? inferKind(text),
    calories,
    proteinGrams,
    hasRpe: /\brpe\b/.test(hay) || /\breps in reserve\b/.test(hay) || /\brir\b/.test(hay),
    hasSetsReps: /\b\d+\s*[x×]\s*\d+\b/.test(hay) || /\b\d+\s*sets?\b/.test(hay),
    hasRestDay: /\brest day\b/.test(hay) || /\boff day\b/.test(hay) || /\bdeload\b/.test(hay),
    hasSleep: /\bsleep\b/.test(hay) || /\bhours? (of )?sleep\b/.test(hay),
    trainingDays: dayMatch ? Number(dayMatch[1]) : null,
    sessionMinutes,
    bannedLifts,
    crashPhrases,
    painPhrases,
    medicalPhrases,
    fastingHours,
    waterCut: /\bwater cut\b/.test(hay) || /\bcut water\b/.test(hay),
    diuretic: /\bdiuretic/.test(hay) || /\blaxative/.test(hay),
    juiceCleanse: /\b(juice|master) cleanse\b/.test(hay),
    trainThroughPain,
    mealSlots,
    liftMentions,
    wordCount: words.length,
    charCount: text.trim().length,
  };
}
