import { INSTRUMENT_SOURCE } from "./sources";
import { parseDraftSignals, type DraftSignals } from "./signals";
import type {
  PioneerGauge,
  PioneerGaugeId,
  PioneerGauges,
  PioneerHousehold,
  PioneerKind,
  PioneerMood,
  PioneerObservation,
} from "./types";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function gauge(
  id: PioneerGaugeId,
  label: string,
  value: number,
  applicable: boolean,
  note: string,
): PioneerGauge {
  return { id, label, value: clamp01(value), applicable, note };
}

function lowestCalorie(signals: DraftSignals) {
  if (!signals.calories.length) return null;
  return Math.min(...signals.calories);
}

function statedProtein(signals: DraftSignals) {
  if (!signals.proteinGrams.length) return null;
  return Math.max(...signals.proteinGrams);
}

export function measurePioneerGauges(
  text: string,
  household: PioneerHousehold,
  signals = parseDraftSignals(text),
): PioneerGauges {
  const kind = signals.kind;
  const trainingLike = kind === "training" || kind === "mixed";
  const nutritionLike = kind === "nutrition" || kind === "mixed";
  const lowCal = lowestCalorie(signals);
  const protein = statedProtein(signals);
  const proteinFloor = household.weightKg ? Math.round(household.weightKg * 1.4) : 80;

  let safetyValue = 1;
  let safetyNote = "No banned-lift or crash-intake flags in the wording.";
  if (signals.trainThroughPain) {
    safetyValue = 0.08;
    safetyNote = "Draft tells someone to work through pain. That is a stop, not a cue.";
  } else if (signals.waterCut || signals.diuretic) {
    safetyValue = 0.1;
    safetyNote = "Water cuts and diuretics are outside this household.";
  } else if (signals.bannedLifts.length) {
    safetyValue = 0.18;
    safetyNote = `Planned wording hits the registry ban: ${signals.bannedLifts[0]}.`;
  } else if (signals.juiceCleanse || signals.crashPhrases.length) {
    safetyValue = 0.22;
    safetyNote = "Cleanse / crash language is not a training diet.";
  } else if (signals.medicalPhrases.length) {
    safetyValue = 0.4;
    safetyNote = "Draft asks for a diagnosis. Pioneer will not go there.";
  } else if (lowCal != null && lowCal < household.calorieFloor) {
    safetyValue = 0.28;
    safetyNote = `${lowCal} kcal is under the household floor (${household.calorieFloor}).`;
  } else if (household.peakDiet && signals.fastingHours.some((h) => h >= 16)) {
    safetyValue = 0.34;
    safetyNote = "A long fast stacked on a peak week is how people skip assigned meals.";
  }

  const fuelApplicable = nutritionLike || lowCal != null || protein != null || signals.fastingHours.length > 0;
  let fuelValue = 0.7;
  let fuelNote = "Fuel is not the main subject of this draft.";
  if (fuelApplicable) {
    if (signals.juiceCleanse || (lowCal != null && lowCal < 1000)) {
      fuelValue = 0.12;
      fuelNote = "Intake in the draft is a crash, not a cut.";
    } else if (lowCal != null && lowCal < household.calorieFloor) {
      fuelValue = 0.25;
      fuelNote = `Stated intake ${lowCal} kcal vs floor ${household.calorieFloor}.`;
    } else if (protein == null && nutritionLike) {
      fuelValue = 0.52;
      fuelNote = `No protein target. Household aim is ${household.proteinTarget} g.`;
    } else if (protein != null && protein < proteinFloor) {
      fuelValue = 0.42;
      fuelNote = `${protein} g protein is thin vs a ${proteinFloor} g floor for this bodyweight.`;
    } else if (
      nutritionLike &&
      /logged, not a wish list/i.test(text) &&
      household.todayCalories < household.calorieTarget * 0.55
    ) {
      fuelValue = household.todayCalories <= 0 ? 0.4 : 0.48;
      fuelNote =
        household.todayCalories <= 0
          ? `Plate is still empty vs a ${household.calorieTarget} energy aim.`
          : `Logged plate ${Math.round(household.todayCalories)} / ${household.calorieTarget} so far.`;
    } else if (protein != null && lowCal != null && lowCal >= household.calorieFloor) {
      fuelValue = 0.88;
      fuelNote = `${lowCal} kcal and ${protein} g protein are in a workable band.`;
    } else if (protein != null) {
      fuelValue = 0.8;
      fuelNote = `Protein ${protein} g is named. Calories still help the read.`;
    } else {
      fuelValue = 0.62;
      fuelNote = `Household target ${household.calorieTarget} kcal / ${household.proteinTarget} g protein.`;
    }
  }

  const stimulusApplicable = trainingLike && (signals.hasSetsReps || signals.hasRpe || signals.liftMentions.length > 0);
  let stimulusValue = 0.45;
  let stimulusNote = "No session structure yet.";
  if (stimulusApplicable) {
    stimulusValue = 0.35;
    if (signals.liftMentions.length) stimulusValue += 0.25;
    if (signals.hasSetsReps) stimulusValue += 0.22;
    if (signals.hasRpe) stimulusValue += 0.18;
    if (!signals.hasRpe && signals.hasSetsReps) {
      stimulusNote = "Sets are named. RPE / RIR is still missing.";
    } else if (signals.hasRpe && signals.hasSetsReps) {
      stimulusNote = "Sets and RPE are both on the page.";
    } else {
      stimulusNote = "Lifts are named without dose.";
    }
  } else if (trainingLike) {
    stimulusNote = "Training talk without sets, RPE, or named lifts.";
  }

  const hardWeek =
    (signals.trainingDays != null && signals.trainingDays >= 6) ||
    signals.sessionMinutes.some((m) => m >= 100);
  const recoveryApplicable = trainingLike || household.fatigue != null || household.deload;
  let recoveryValue = 0.72;
  let recoveryNote = "Recovery is quiet in the draft.";
  if (recoveryApplicable) {
    if (household.fatigue != null && household.fatigue <= 2 && !signals.hasRestDay) {
      recoveryValue = 0.4;
      recoveryNote = "Energy check is low and the draft still reads like a hard week.";
    } else if (hardWeek && !signals.hasRestDay && !signals.hasSleep) {
      recoveryValue = 0.38;
      recoveryNote = "High frequency or long sessions with no rest or sleep line.";
    } else if (household.deload && signals.hasSetsReps && !signals.hasRestDay && !/\bdeload\b/i.test(text)) {
      recoveryValue = 0.5;
      recoveryNote = "Household deload is on. The draft does not mention an easy week.";
    } else if (signals.hasSleep || signals.hasRestDay) {
      recoveryValue = 0.9;
      recoveryNote = "Rest or sleep is on the page.";
    }
  }

  const adherenceApplicable = signals.charCount >= 40;
  let adherenceValue = 0.82;
  let adherenceNote = "The week looks like something a household can run.";
  if (adherenceApplicable) {
    if (signals.trainingDays != null && signals.trainingDays >= 7 && signals.sessionMinutes.some((m) => m >= 90)) {
      adherenceValue = 0.28;
      adherenceNote = "Seven long days is a brochure, not a household week.";
    } else if (signals.trainingDays != null && signals.trainingDays > household.daysPerWeek + 2) {
      adherenceValue = 0.48;
      adherenceNote = `${signals.trainingDays} training days vs a ${household.daysPerWeek}-day household week.`;
    } else if (signals.sessionMinutes.some((m) => m > household.sessionMinutes + 25) && !/cap|over the clock|runs long/i.test(text)) {
      adherenceValue = 0.55;
      adherenceNote = `Sessions over ${household.sessionMinutes} min without saying the clock may run long.`;
    } else if (nutritionLike && signals.mealSlots.length === 1 && household.proteinTarget >= 120) {
      adherenceValue = 0.6;
      adherenceNote = "One named meal for a high protein target is a hard day to live.";
    }
  }

  const gauges = {
    stimulus: gauge("stimulus", "Stimulus", stimulusValue, stimulusApplicable || trainingLike, stimulusNote),
    fuel: gauge("fuel", "Fuel", fuelValue, fuelApplicable, fuelNote),
    recovery: gauge("recovery", "Recovery", recoveryValue, recoveryApplicable, recoveryNote),
    safety: gauge("safety", "Safety", safetyValue, true, safetyNote),
    adherence: gauge("adherence", "Adherence", adherenceValue, adherenceApplicable, adherenceNote),
  };

  const weights: Record<PioneerGaugeId, number> = {
    safety: 1.4,
    fuel: 1.2,
    stimulus: 1.1,
    recovery: 1,
    adherence: 0.9,
  };
  let score = 0;
  let weight = 0;
  const rails: PioneerGaugeId[] = [];
  for (const id of Object.keys(weights) as PioneerGaugeId[]) {
    const g = gauges[id];
    if (!g.applicable) continue;
    score += g.value * weights[id];
    weight += weights[id];
    if (g.value < 0.62) rails.push(id);
  }
  const onCourse = weight ? score / weight : 0.5;

  return { ...gauges, onCourse, rails };
}

export function gaugesToMood(gauges: PioneerGauges): PioneerMood {
  if (gauges.safety.value < 0.45) return "caution";
  if (gauges.onCourse >= 0.82) return "on_course";
  if (gauges.onCourse >= 0.58) return "thinking";
  return "drift";
}

export function instrumentObservations(
  text: string,
  household: PioneerHousehold,
  signals = parseDraftSignals(text),
  gauges = measurePioneerGauges(text, household, signals),
): PioneerObservation[] {
  const out: PioneerObservation[] = [];
  const quoteFor = (needle: string) => {
    const idx = text.toLowerCase().indexOf(needle.toLowerCase());
    if (idx < 0) return undefined;
    return text.slice(idx, idx + needle.length);
  };

  if (signals.trainThroughPain) {
    out.push({
      id: "train-through-pain",
      layer: "instrument",
      what: "The draft treats pain as something to push through.",
      why: "Sharp, hot, numb, or radiating pain is a stop in this house — not a toughness test.",
      question: "If a joint is barking, what gets swapped or skipped today?",
      source: INSTRUMENT_SOURCE,
      quote: quoteFor("train through") ?? quoteFor("push through") ?? quoteFor("no pain no gain"),
      about: "existing",
    });
  }

  if (signals.bannedLifts.length) {
    const hit = signals.bannedLifts[0]!;
    out.push({
      id: "banned-lift",
      layer: "instrument",
      what: `A banned lift is written as planned work: ${hit}.`,
      why: "Bench/chair/bar dips, behind-the-neck work, chin-height upright rows, and kipping prep are off the registry.",
      question: "Which allowed swap belongs in that slot?",
      source: "Garanimal registry",
      quote: quoteFor(hit),
      about: "existing",
    });
  }

  if (signals.waterCut || signals.diuretic) {
    out.push({
      id: "water-cut",
      layer: "instrument",
      what: "The draft reaches for a water cut or a diuretic.",
      why: "This app will not coach dehydration. Peak weeks stay calorie-floored and eat the assigned meals.",
      source: INSTRUMENT_SOURCE,
      quote: quoteFor("water cut") ?? quoteFor("diuretic") ?? quoteFor("laxative"),
      about: "existing",
    });
  }

  const lowCal = lowestCalorie(signals);
  if (lowCal != null && lowCal < household.calorieFloor) {
    out.push({
      id: "below-floor",
      layer: "instrument",
      what: `Stated intake ${lowCal} kcal is under the household floor of ${household.calorieFloor}.`,
      why: "Floors exist so a cut cannot become a personality. Helms-style losses stay slow on purpose.",
      question: "Is this a logging miss, or are you actually planning to eat that little?",
      source: "Household floor",
      quote: quoteFor(`${lowCal}`) ? `${lowCal}` : undefined,
      about: "existing",
    });
  } else if (signals.juiceCleanse || signals.crashPhrases.length) {
    out.push({
      id: "crash-diet",
      layer: "instrument",
      what: "Crash or cleanse language showed up.",
      why: "A training diet survives a deficit. It does not survive a juice week.",
      source: INSTRUMENT_SOURCE,
      quote: quoteFor(signals.crashPhrases[0] ?? "juice cleanse"),
      about: "existing",
    });
  }

  if (household.peakDiet && signals.fastingHours.some((h) => h >= 16)) {
    out.push({
      id: "peak-plus-fast",
      layer: "instrument",
      what: "A long fasting window is stacked on a peak-style diet.",
      why: "Peak week is not a second deficit. Eat the assigned meals.",
      source: INSTRUMENT_SOURCE,
      about: "alignment",
    });
  }

  const protein = statedProtein(signals);
  const proteinFloor = household.weightKg ? Math.round(household.weightKg * 1.4) : 80;
  if (
    /logged, not a wish list/i.test(text) &&
    household.todayCalories < household.calorieTarget * 0.55
  ) {
    out.push({
      id: "light-plate",
      layer: "instrument",
      what:
        household.todayCalories <= 0
          ? "The logged plate is still empty."
          : `The logged plate is ${Math.round(household.todayCalories)} vs an aim of ${household.calorieTarget}.`,
      why: "Pioneer reads what was eaten, not the target line. A thin log is a gap, not a moral failure.",
      question: "Is this a late meal, or did the day actually stay this light?",
      source: INSTRUMENT_SOURCE,
      about: "gap",
    });
  }

  if ((signals.kind === "nutrition" || signals.kind === "mixed") && protein == null && signals.charCount >= 80) {
    out.push({
      id: "missing-protein",
      layer: "instrument",
      what: "No protein target is written.",
      why: `ISSN-range household aim is ${household.proteinTarget} g. A food draft without protein is a vibe, not a plate.`,
      question: "Where do the protein grams actually come from today?",
      source: INSTRUMENT_SOURCE,
      about: "gap",
    });
  } else if (protein != null && protein < proteinFloor) {
    out.push({
      id: "thin-protein",
      layer: "instrument",
      what: `${protein} g protein is light for this bodyweight.`,
      why: "Most lifters do better near 1.6–2.2 g/kg. Going well under 1.4 g/kg in a deficit costs muscle first.",
      source: "ISSN protein position",
      about: "existing",
    });
  }

  if ((signals.kind === "training" || signals.kind === "mixed") && signals.hasSetsReps && !signals.hasRpe && signals.charCount >= 80) {
    out.push({
      id: "missing-rpe",
      layer: "instrument",
      what: "Sets are written without RPE or RIR.",
      why: "Helms–Zourdos RPE is how this house decides whether to add a plate or repeat the load.",
      question: "What RPE are the main sets supposed to live at?",
      source: INSTRUMENT_SOURCE,
      about: "gap",
    });
  }

  if (gauges.adherence.value < 0.5) {
    out.push({
      id: "adherence-fantasy",
      layer: "instrument",
      what: gauges.adherence.note,
      why: "A plan that only works on a rest-of-life week will not get logged.",
      question: "What still happens if you have 45 real minutes?",
      source: INSTRUMENT_SOURCE,
      about: "alignment",
    });
  }

  if (gauges.recovery.value < 0.45) {
    out.push({
      id: "recovery-gap",
      layer: "instrument",
      what: gauges.recovery.note,
      why: "Hard weeks without a rest line are how session RPE creeps up and stays there.",
      source: INSTRUMENT_SOURCE,
      about: "gap",
    });
  }

  if (signals.medicalPhrases.length) {
    out.push({
      id: "medical-overreach",
      layer: "instrument",
      what: "The draft is asking for a diagnosis.",
      why: "Pioneer reads training and food wording. It does not practice medicine.",
      source: INSTRUMENT_SOURCE,
      about: "existing",
    });
  }

  const rank: Record<string, number> = {
    "train-through-pain": 100,
    "water-cut": 95,
    "banned-lift": 90,
    "below-floor": 85,
    "crash-diet": 80,
    "peak-plus-fast": 75,
    "medical-overreach": 70,
    "thin-protein": 50,
    "light-plate": 48,
    "missing-protein": 45,
    "recovery-gap": 40,
    "missing-rpe": 35,
    "adherence-fantasy": 30,
  };

  return out.sort((a, b) => (rank[b.id] ?? 0) - (rank[a.id] ?? 0)).slice(0, 4);
}

export function statusLineFor(input: {
  status: "waiting" | "reading" | "instrument" | "pioneer" | "refused" | "dark" | "unavailable";
  kind: PioneerKind;
  charCount: number;
  minChars: number;
}): string {
  switch (input.status) {
    case "waiting":
      return input.charCount < 20
        ? "Waiting for more text…"
        : `Waiting for ${input.minChars} characters before a pioneer read…`;
    case "reading":
      return "Reading the draft…";
    case "instrument":
      return "Instrument reading";
    case "pioneer":
      return "Pioneer corroborated";
    case "refused":
      return "Turn refused — instruments still live";
    case "dark":
      return "Pioneer dark — instruments still live";
    case "unavailable":
      return "Pioneer unavailable — instruments still live";
  }
}
