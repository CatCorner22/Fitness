import type { AssessmentResult, DomainScore, FitnessPlanAdjust } from "./types";

function scoreOf(result: AssessmentResult, id: AssessmentResult["domains"][number]["id"]): DomainScore | null {
  return result.domains.find((d) => d.id === id)?.score ?? null;
}

export function emptyAdjust(): FitnessPlanAdjust {
  return {
    rpeAdjust: 0,
    accessorySetAdjust: 0,
    restMultiplier: 1,
    squatSwap: null,
    pressSwap: null,
    avoidSingleLeg: false,
    easyCardio: false,
    addPlank: false,
    addWalk: false,
    notes: [],
  };
}

export function planAdjustFromAssessment(result: AssessmentResult | null): FitnessPlanAdjust {
  if (!result || result.overall == null) {
    return { ...emptyAdjust(), notes: result?.planNotes ?? [] };
  }

  const aerobic = scoreOf(result, "aerobic");
  const push = scoreOf(result, "push");
  const lower = scoreOf(result, "lower");
  const core = scoreOf(result, "core");
  const balance = scoreOf(result, "balance");
  const mobility = scoreOf(result, "mobility");
  const notes: string[] = [...result.planNotes];

  const adjust: FitnessPlanAdjust = {
    rpeAdjust: 0,
    accessorySetAdjust: 0,
    restMultiplier: 1,
    squatSwap: null,
    pressSwap: null,
    avoidSingleLeg: false,
    easyCardio: false,
    addPlank: false,
    addWalk: false,
    notes,
  };

  if (result.overall === "foundation") {
    adjust.rpeAdjust = -1;
    adjust.accessorySetAdjust = -1;
    adjust.restMultiplier = 1.2;
    notes.push("Foundation band: a bit more rest, slightly easier RPE, fewer junk accessories.");
  } else if (result.overall === "developing") {
    adjust.rpeAdjust = -0.5;
    adjust.restMultiplier = 1.1;
    notes.push("Developing band: leave an extra rep in the tank until the lifts look boringly clean.");
  } else if (result.overall === "strong") {
    adjust.rpeAdjust = 0.25;
    notes.push("Strong band: you can work a little closer to the listed RPE. Week 1 is still week 1 — no jumping to a peak.");
  }

  if ((mobility ?? 5) <= 2 || (lower ?? 5) <= 2) {
    adjust.squatSwap = (mobility ?? 5) <= 1 ? "goblet-squat" : "box-squat";
    notes.push(
      adjust.squatSwap === "goblet-squat"
        ? "Squat pattern → goblet squat until the overhead squat screen cleans up."
        : "Squat pattern → box squat so depth is honest.",
    );
  }
  if ((mobility ?? 5) <= 2 || (push ?? 5) <= 1) {
    adjust.pressSwap = (mobility ?? 5) <= 1 ? "landmine-press" : "db-shoulder-press";
    notes.push("Overhead work stays in front — dumbbell or landmine, not a behind-the-neck press.");
  }
  if ((balance ?? 5) <= 2) {
    adjust.avoidSingleLeg = true;
    notes.push("Balance is the limiter — bilateral or supported lunges instead of Bulgarian splits.");
  }
  if ((core ?? 5) <= 2) {
    adjust.addPlank = true;
    notes.push("Adding a short plank. Sit-ups are not the test and not the fix (McGill).");
  }
  if ((aerobic ?? 5) <= 2) {
    adjust.easyCardio = true;
    adjust.addWalk = result.overall === "foundation" || aerobic === 1;
    notes.push("Aerobic score is low — easy walk/bike instead of smash intervals.");
  }

  adjust.notes = notes;
  return adjust;
}

const SQUAT_IDS = new Set(["back-squat", "front-squat", "pause-squat"]);
const PRESS_IDS = new Set(["ohp"]);
const SINGLE_LEG_IDS = new Set(["bulgarian-split-squat"]);
const HARD_CARDIO = new Set(["intervals", "stage-circuit"]);

export function remapExerciseId(exerciseId: string, adjust: FitnessPlanAdjust, equipment: string[]) {
  if (adjust.squatSwap && SQUAT_IDS.has(exerciseId)) return adjust.squatSwap;
  if (adjust.pressSwap && PRESS_IDS.has(exerciseId)) {
    if (adjust.pressSwap === "landmine-press" && !equipment.includes("landmine") && !equipment.includes("barbell")) {
      return "db-shoulder-press";
    }
    return adjust.pressSwap;
  }
  if (adjust.avoidSingleLeg && SINGLE_LEG_IDS.has(exerciseId)) return "walking-lunge";
  if (adjust.easyCardio && HARD_CARDIO.has(exerciseId)) return "zone2-walk";
  return exerciseId;
}
