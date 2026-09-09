import type { BodyCompGoal, Experience, Sex } from "@/lib/types";
import { type EvidenceId } from "@/lib/nutrition/evidence";

/**
 * Body-composition planner.
 *
 * Pure functions: profile numbers in, targets out. Every constant carries the
 * evidence id it came from (see evidence.ts). No DB access here so the whole
 * thing can be asserted from a script.
 */

export const BODY_COMP_GOALS: readonly BodyCompGoal[] = ["lean", "recomp", "maintain", "gain"];

export type BodyCompOption = {
  id: BodyCompGoal;
  label: string;
  short: string;
  blurb: string;
};

export const BODY_COMP_OPTIONS: BodyCompOption[] = [
  {
    id: "lean",
    label: "Get leaner",
    short: "Lose fat, keep muscle",
    blurb:
      "A capped deficit sized to your body fat, protein high enough to protect muscle, and a diet break built in. 0.5–1% of bodyweight per week — not a crash.",
  },
  {
    id: "recomp",
    label: "Recomp",
    short: "Same weight, better shape",
    blurb:
      "Maintenance calories with the highest protein target and progressive lifting. Slow, real, and best for newer lifters or people coming back.",
  },
  {
    id: "maintain",
    label: "Maintain",
    short: "Hold weight, fuel training",
    blurb: "Eat what you burn. Protein stays high, carbs sit around sessions. The default when you are between blocks.",
  },
  {
    id: "gain",
    label: "Gain mass",
    short: "Build muscle with a small surplus",
    blurb:
      "A 10–20% surplus scaled to experience, 0.25–0.5% of bodyweight per week. More carbs, moderate fat, protein around 1.8 g/kg.",
  },
];

export function bodyCompOption(goal: BodyCompGoal): BodyCompOption {
  return BODY_COMP_OPTIONS.find((o) => o.id === goal) ?? BODY_COMP_OPTIONS[2];
}

/** ACE body-fat categories (US). Used only to size a deficit and to refuse unsafe ones. */
export type BodyFatBand = "essential" | "athlete" | "fitness" | "average" | "high";

export const BODY_FAT_BANDS: {
  band: BodyFatBand;
  label: string;
  female: [number, number];
  male: [number, number];
  cue: string;
}[] = [
  { band: "essential", label: "Essential fat", female: [10, 13], male: [2, 5], cue: "Contest-day lean. Not a place to diet from." },
  { band: "athlete", label: "Athletic", female: [14, 20], male: [6, 13], cue: "Visible abs in normal light, veins on forearms." },
  { band: "fitness", label: "Fit", female: [21, 24], male: [14, 17], cue: "Defined arms and shoulders; abs show when flexed." },
  { band: "average", label: "Average", female: [25, 31], male: [18, 24], cue: "Soft midsection, some definition in arms." },
  { band: "high", label: "Higher", female: [32, 60], male: [25, 60], cue: "Little visible muscle definition." },
];

export function bodyFatBand(pct: number | null | undefined, sex: Sex): BodyFatBand | null {
  if (pct == null || !Number.isFinite(pct) || pct <= 0) return null;
  const key = sex === "female" ? "female" : "male";
  // Unspecified sex uses male thresholds shifted halfway toward female.
  for (const row of BODY_FAT_BANDS) {
    const [lo, hi] = row[key];
    const [flo, fhi] = row.female;
    const upper = sex === "unspecified" ? (hi + fhi) / 2 : hi;
    const lower = sex === "unspecified" ? (lo + flo) / 2 : lo;
    if (pct >= lower && pct <= upper) return row.band;
  }
  const last = BODY_FAT_BANDS[BODY_FAT_BANDS.length - 1];
  const [lo] = sex === "female" ? last.female : last.male;
  if (pct > lo) return "high";
  return "essential";
}

export type BodyCompInput = {
  goal: BodyCompGoal;
  sex: Sex;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  bodyFatPct: number | null;
  experience: Experience;
  mealsPerDay: number;
  /** Maintenance estimate (static Mifflin × activity or adaptive). Null when the profile is incomplete. */
  tdee: number | null;
  /** Minimum eating target for this person (sex + diet). */
  calorieFloor: number;
};

export type BodyCompGuard = {
  code: "underweight" | "essential-fat" | "no-weight" | "no-tdee";
  message: string;
};

export type BodyCompTargets = {
  goal: BodyCompGoal;
  title: string;
  /** Weekly bodyweight change target as % of bodyweight (negative = loss). */
  weeklyRatePct: number;
  weeklyRateKg: number;
  /** kcal/day relative to TDEE. */
  delta: number;
  tdee: number | null;
  calories: number;
  floor: number;
  proteinG: number;
  proteinPerKg: number;
  fatG: number;
  fatPerKg: number;
  carbsG: number;
  carbsPerKg: number;
  fiberG: number;
  waterL: number;
  mealsPerDay: number;
  perMealProteinG: number;
  perMealProteinPerKg: number;
  ffmKg: number | null;
  bodyFatBand: BodyFatBand | null;
  /** Ratios over the calories left after protein — for the existing macroTargets shape. */
  carbRatio: number;
  fatRatio: number;
  guards: BodyCompGuard[];
  notes: string[];
  citations: EvidenceId[];
};

const KCAL_PER_KG_TISSUE = 7700; // hall-2008: rough average, corrected by weigh-ins
const DEFICIT_CAP_LIFTER = 500; // murphy-koehler-2022
const DEFICIT_CAP_HIGH_BF = 750; // aha-acc-tos-2013
const DEFICIT_MIN = 250;
const SURPLUS_MIN = 200;
const SURPLUS_MAX = 500; // iraki-2019: ~10–20% of maintenance

function round(n: number, step = 1) {
  const decimals = step >= 1 ? 0 : Math.ceil(-Math.log10(step));
  return Number((Math.round(n / step) * step).toFixed(decimals));
}

function bmi(weightKg: number | null, heightCm: number | null) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Weekly loss rate from body-fat band: leaner people cut slower (issn-diets-2017; helms-2014-jissn). */
export function lossRatePct(band: BodyFatBand | null): number {
  switch (band) {
    case "essential":
      return 0; // refused below
    case "athlete":
      return 0.5;
    case "fitness":
      return 0.6;
    case "average":
      return 0.75;
    case "high":
      return 1.0;
    default:
      return 0.6; // unknown body fat: sit toward the conservative end
  }
}

/** Weekly gain rate from training age (iraki-2019). */
export function gainRatePct(experience: Experience): number {
  if (experience === "novice") return 0.5;
  if (experience === "intermediate") return 0.35;
  return 0.25;
}

/** Protein per kg bodyweight. Uses fat-free mass when body fat is known (issn-diets-2017). */
export function proteinPerKgFor(goal: BodyCompGoal, bodyFatPct: number | null): number {
  const ffmFraction = bodyFatPct && bodyFatPct > 0 && bodyFatPct < 60 ? 1 - bodyFatPct / 100 : null;
  switch (goal) {
    case "lean": {
      // 2.3–3.1 g/kg FFM → use 2.6 g/kg FFM; fall back to 2.2 g/kg bodyweight.
      const perKg = ffmFraction ? 2.6 * ffmFraction : 2.2;
      return Math.min(2.7, Math.max(1.8, perKg));
    }
    case "recomp": {
      // barakat-2020: ~2.6–3.5 g/kg FFM; we take the lower end.
      const perKg = ffmFraction ? 2.7 * ffmFraction : 2.2;
      return Math.min(2.6, Math.max(1.8, perKg));
    }
    case "gain":
      return 1.8; // iraki-2019: 1.6–2.2
    case "maintain":
    default:
      return 1.8; // issn-protein-2017: 1.4–2.0 for exercising adults
  }
}

/** Fat per kg bodyweight. iraki-2019 0.5–1.5 g/kg; helms-2014 15–30% kcal. */
export function fatPerKgFor(goal: BodyCompGoal): number {
  switch (goal) {
    case "lean":
      return 0.8;
    case "recomp":
      return 0.9;
    case "gain":
      return 1.0;
    default:
      return 1.0;
  }
}

export function bodyCompTargets(input: BodyCompInput): BodyCompTargets {
  const { goal, sex } = input;
  const weight = input.weightKg && input.weightKg > 0 ? input.weightKg : null;
  const band = bodyFatBand(input.bodyFatPct, sex);
  const ffm = weight && input.bodyFatPct ? round(weight * (1 - input.bodyFatPct / 100), 0.1) : null;
  const meals = Math.min(6, Math.max(3, Math.round(input.mealsPerDay || 4)));
  const guards: BodyCompGuard[] = [];
  const notes: string[] = [];
  const citations: EvidenceId[] = ["mifflin-1990", "frankenfield-2005"];

  if (!weight) {
    guards.push({ code: "no-weight", message: "Add bodyweight under You so protein and the rate can be sized." });
  }
  if (input.tdee == null) {
    guards.push({
      code: "no-tdee",
      message: "Add age, height, weight, and sex under You for a personal expenditure estimate. Using a placeholder until then.",
    });
  }

  let ratePct = 0;
  let delta = 0;
  const currentBmi = bmi(weight, input.heightCm);

  if (goal === "lean") {
    citations.push("issn-diets-2017", "helms-2014-jissn", "murphy-koehler-2022", "aha-acc-tos-2013", "hall-2008", "garthe-2011");
    const underweight = currentBmi != null && currentBmi < 18.5;
    const essential = band === "essential";
    if (underweight) {
      guards.push({
        code: "underweight",
        message: "BMI is under 18.5. This module will not prescribe a deficit here — it holds you at maintenance. Talk to a clinician before cutting.",
      });
    } else if (essential) {
      guards.push({
        code: "essential-fat",
        message:
          "You are at essential body fat. A deficit from here is a medical problem, not a goal. Calories are held at maintenance; pick Gain or Recomp.",
      });
    } else {
      ratePct = -lossRatePct(band);
      if (weight) {
        const raw = (Math.abs(ratePct) / 100) * weight * (KCAL_PER_KG_TISSUE / 7);
        const cap = band === "high" ? DEFICIT_CAP_HIGH_BF : DEFICIT_CAP_LIFTER;
        delta = -Math.min(cap, Math.max(DEFICIT_MIN, round(raw, 10)));
      } else {
        delta = -400;
      }
      notes.push(
        band == null
          ? "Body fat is unknown, so the rate sits at 0.6% of bodyweight per week. Add an estimate to let it move between 0.5% and 1%."
          : band === "high"
            ? "Higher starting body fat tolerates a faster cut (up to ~1%/week and a 750 kcal deficit). The deficit still stops at the floor."
            : "Leaner people cut slower to keep muscle: the deficit is capped at ~500 kcal/day so lifting can still add lean mass.",
      );
      notes.push("Plan a maintenance week every 8–12 weeks. The Steady cut block does this for you and adds a diet break at the end.");
    }
  } else if (goal === "gain") {
    citations.push("iraki-2019", "issn-diets-2017", "hall-2008");
    ratePct = gainRatePct(input.experience);
    if (weight) {
      const raw = (ratePct / 100) * weight * (KCAL_PER_KG_TISSUE / 7);
      const pctCap = input.tdee ? round(input.tdee * 0.2, 10) : SURPLUS_MAX;
      delta = Math.min(SURPLUS_MAX, pctCap, Math.max(SURPLUS_MIN, round(raw, 10)));
    } else {
      delta = 300;
    }
    notes.push(
      input.experience === "novice"
        ? "Newer lifters can gain closer to 0.5% of bodyweight per week; most of that can be muscle if the training is progressive."
        : "Experienced lifters gain slower (0.25–0.35%/week). A bigger surplus mostly adds fat once protein and training are in place.",
    );
    if (band === "high") {
      notes.push("At higher body fat a surplus adds fat faster than muscle. Consider Recomp or Get leaner first.");
    }
  } else if (goal === "recomp") {
    citations.push("barakat-2020", "issn-protein-2017", "murphy-koehler-2022");
    notes.push("Recomp is real for newer lifters, people returning after a layoff, and people with more fat to lose. Lean intermediates should pick a direction.");
  } else {
    citations.push("issn-protein-2017", "issn-diets-2017");
  }

  const floor = input.calorieFloor;
  const tdee = input.tdee;
  const fallback = goal === "gain" ? 2700 : goal === "lean" ? 1800 : 2200;
  let calories = tdee != null ? round(tdee + delta, 5) : fallback;
  if (calories < floor) {
    if (goal === "lean") notes.push(`The deficit was clipped at the ${floor} kcal floor. Add activity rather than cutting food further.`);
    calories = floor;
  }
  calories = Math.min(6000, calories);

  const proteinPerKg = proteinPerKgFor(goal, input.bodyFatPct);
  const fatPerKg = fatPerKgFor(goal);
  const kg = weight ?? 70;
  const proteinG = round(proteinPerKg * kg);
  citations.push("issn-protein-2017", "schoenfeld-aragon-2018", "mamerow-2014", "iom-2005-macros", "dga-2020", "iom-2004-water");
  if (goal === "lean" || goal === "recomp") citations.push("hudson-2020", "weinheimer-2010", "longland-2016", "antonio-2015");

  // Fat: g/kg target, but never below 20% of calories (IOM AMDR lower bound) and never so high that carbs vanish.
  let fatG = round(fatPerKg * kg);
  const fatFloorFromPct = round((calories * 0.2) / 9);
  fatG = Math.max(fatG, fatFloorFromPct);
  let carbsG = round((calories - proteinG * 4 - fatG * 9) / 4);
  if (carbsG < 50) {
    // Trim fat toward its 0.5 g/kg minimum before touching protein.
    const minFat = Math.max(round(0.5 * kg), fatFloorFromPct);
    fatG = Math.max(minFat, round((calories - proteinG * 4 - 50 * 4) / 9));
    carbsG = round((calories - proteinG * 4 - fatG * 9) / 4);
    if (carbsG < 50) {
      calories = round(proteinG * 4 + fatG * 9 + 50 * 4, 5);
      carbsG = 50;
      notes.push("Calories were raised slightly so protein and minimum fat still leave room for some carbohydrate.");
    }
  }

  const carbsPerKg = carbsG / kg;
  if (goal === "gain" && carbsPerKg < 3) {
    notes.push("Carbs land under 3 g/kg. If lifting feels flat, add carbs around sessions before adding fat.");
  }

  const remaining = Math.max(1, calories - proteinG * 4);
  const fatShare = Math.min(0.95, Math.max(0.05, (fatG * 9) / remaining));

  const perMeal = proteinG / meals;
  const perMealPerKg = perMeal / kg;
  if (perMealPerKg < 0.4 && meals > 3) {
    notes.push(
      `${meals} meals spreads protein to ${Math.round(perMeal)} g each (${perMealPerKg.toFixed(2)} g/kg). Fewer, bigger meals reach the 0.4 g/kg per-meal target.`,
    );
  } else if (perMealPerKg > 0.6) {
    notes.push(`Each meal carries ${Math.round(perMeal)} g protein. Whole-food meals with fat and fiber digest slowly enough for that to be used.`);
  }

  return {
    goal,
    title: bodyCompOption(goal).label,
    weeklyRatePct: ratePct,
    weeklyRateKg: weight ? round((ratePct / 100) * weight, 0.01) : 0,
    delta,
    tdee,
    calories,
    floor,
    proteinG,
    proteinPerKg: round(proteinPerKg, 0.01),
    fatG,
    fatPerKg: round(fatG / kg, 0.01),
    carbsG,
    carbsPerKg: round(carbsPerKg, 0.1),
    fiberG: round((calories / 1000) * 14),
    waterL: sex === "female" ? 2.7 : sex === "male" ? 3.7 : 3.2,
    mealsPerDay: meals,
    perMealProteinG: round(perMeal),
    perMealProteinPerKg: round(perMealPerKg, 0.01),
    ffmKg: ffm,
    bodyFatBand: band,
    carbRatio: round(1 - fatShare, 0.01),
    fatRatio: round(fatShare, 0.01),
    guards,
    notes,
    citations,
  };
}

export type ProgressVerdict = {
  status: "insufficient" | "on-track" | "too-slow" | "too-fast" | "drifting";
  headline: string;
  detail: string;
  /** Suggested calorie change to apply, 0 to hold. */
  adjustKcal: number;
};

/**
 * Compare the observed weekly change against the target rate. Uses the same
 * ±100–150 kcal step the coaching literature uses (iraki-2019; helms-2014).
 */
export function progressVerdict(input: {
  goal: BodyCompGoal;
  weightKg: number | null;
  targetWeeklyKg: number;
  observedWeeklyKg: number | null;
  weighIns: number;
  spanDays: number;
}): ProgressVerdict {
  const { goal, observedWeeklyKg, weighIns, spanDays } = input;
  if (observedWeeklyKg == null || !Number.isFinite(observedWeeklyKg) || weighIns < 8 || spanDays < 10) {
    return {
      status: "insufficient",
      headline: "Not enough weigh-ins yet",
      detail: `Log a morning weight most days. After ~8 weigh-ins across 10+ days the module compares your weekly average to the target and suggests a ±100–150 kcal change if needed.`,
      adjustKcal: 0,
    };
  }
  const kg = input.weightKg ?? 70;
  const observedPct = (observedWeeklyKg / kg) * 100;
  const target = input.targetWeeklyKg;
  const tolerance = Math.max(0.15, Math.abs(target) * 0.5);
  const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)} kg/week`;

  if (goal === "maintain" || goal === "recomp") {
    if (Math.abs(observedPct) <= 0.25) {
      return { status: "on-track", headline: "Holding steady", detail: `Trend ${fmt(observedWeeklyKg)}. That is maintenance. Let training do the composition work.`, adjustKcal: 0 };
    }
    const adjust = observedWeeklyKg > 0 ? -125 : 125;
    return {
      status: "drifting",
      headline: observedWeeklyKg > 0 ? "Drifting up" : "Drifting down",
      detail: `Trend ${fmt(observedWeeklyKg)} (${observedPct.toFixed(2)}%/week). If this holds two weeks, move calories ${adjust > 0 ? "+" : ""}${adjust} kcal.`,
      adjustKcal: adjust,
    };
  }

  if (Math.abs(observedWeeklyKg - target) <= tolerance) {
    return { status: "on-track", headline: "On track", detail: `Trend ${fmt(observedWeeklyKg)} vs target ${fmt(target)}. Hold calories.`, adjustKcal: 0 };
  }

  if (goal === "lean") {
    if (observedWeeklyKg > target) {
      // losing slower than planned (or gaining)
      return {
        status: "too-slow",
        headline: "Slower than planned",
        detail: `Trend ${fmt(observedWeeklyKg)} vs target ${fmt(target)}. Check logging first. If two weeks look like this, drop 100–150 kcal (never below the floor) or add 1,500–2,000 steps a day.`,
        adjustKcal: -125,
      };
    }
    return {
      status: "too-fast",
      headline: "Faster than planned",
      detail: `Trend ${fmt(observedWeeklyKg)} vs target ${fmt(target)}. Above ~1% of bodyweight per week the loss starts coming from muscle. Add 100–150 kcal, mostly carbs.`,
      adjustKcal: 125,
    };
  }

  // gain
  if (observedWeeklyKg < target) {
    return {
      status: "too-slow",
      headline: "Gaining slower than planned",
      detail: `Trend ${fmt(observedWeeklyKg)} vs target ${fmt(target)}. If two weeks look like this, add 100–150 kcal, mostly carbs around training.`,
      adjustKcal: 125,
    };
  }
  return {
    status: "too-fast",
    headline: "Gaining faster than planned",
    detail: `Trend ${fmt(observedWeeklyKg)} vs target ${fmt(target)} (${observedPct.toFixed(2)}%/week). Above ~0.5% of bodyweight per week is mostly fat. Trim 100–150 kcal.`,
    adjustKcal: -125,
  };
}
