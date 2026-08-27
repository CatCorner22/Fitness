import type { PioneerHousehold, PioneerKind, PioneerProfile } from "./types";
import type { DraftSignals } from "./signals";

export function resolvePioneerProfile(
  signals: DraftSignals,
  household: PioneerHousehold,
): PioneerProfile {
  const medical = signals.medicalPhrases.length > 0;
  const throughPain = signals.trainThroughPain || signals.painPhrases.length > 0;
  const crash =
    signals.waterCut ||
    signals.diuretic ||
    signals.juiceCleanse ||
    signals.crashPhrases.length > 0 ||
    signals.calories.some((n) => n > 0 && n < household.calorieFloor);
  const peakFast = household.peakDiet && signals.fastingHours.some((h) => h >= 16);
  const injuryPlusHard =
    household.injuries.length > 0 && (signals.hasRpe === false ? signals.hasSetsReps : true) && throughPain;

  if (medical || throughPain || signals.waterCut || signals.diuretic || peakFast || injuryPlusHard) {
    return { id: "strict", minReads: 2, unanimous: true, allowInternalRewrite: false };
  }
  if (crash || household.deload || household.fatigue != null && household.fatigue <= 2) {
    return { id: "caution", minReads: 2, unanimous: false, allowInternalRewrite: false };
  }
  return { id: "standard", minReads: 1, unanimous: false, allowInternalRewrite: false };
}

export function lensesFor(kind: PioneerKind, profile: PioneerProfile): string[] {
  const all = {
    stimulus: "Focus this read on STIMULUS: sets, RPE, volume, exercise selection vs the safety registry. Do not write the draft.",
    fuel: "Focus this read on FUEL: protein, energy availability, deficit honesty, fasting stacked on a peak. Do not write the draft.",
    safety: "Focus this read on SAFETY: banned lifts, pain language, medical overreach, water cuts, crash intake. Do not write the draft.",
    recovery: "Focus this read on RECOVERY: sleep, rest days, deload, concurrent-training spacing. Do not write the draft.",
    adherence: "Focus this read on ADHERENCE: time budget, days/week realism, household equipment, plans that only work on paper. Do not write the draft.",
  };

  if (profile.id === "strict") return [all.safety, all.fuel, all.stimulus];
  if (kind === "nutrition") return [all.fuel, all.safety, all.adherence];
  if (kind === "training") return [all.stimulus, all.safety, all.recovery];
  return [all.stimulus, all.fuel, all.safety];
}

export function strictPromptAddendum(profile: PioneerProfile): string {
  if (profile.id === "standard") return "";
  if (profile.id === "strict") {
    return "STRICT READ: safety and energy availability first. Never tell the human to train through sharp, hot, numb, or radiating pain. Never endorse water cuts, diuretics, or intake under the household floor. Prefer a question over a plan.";
  }
  return "CAUTION READ: prefer recovery and sustainable fuel over extra volume or a deeper cut. Do not invent work the draft did not ask for.";
}
