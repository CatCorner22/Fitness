import type { Experience, Sex } from "@/lib/types";
import type {
  AssessmentInput,
  AssessmentResult,
  DomainResult,
  DomainScore,
  FitnessTier,
  PushupStyle,
} from "./types";
import { DOMAIN_LABEL } from "./types";

function ageBand(age: number | null) {
  const a = age ?? 30;
  if (a < 20) return 15;
  if (a < 30) return 20;
  if (a < 40) return 30;
  if (a < 50) return 40;
  if (a < 60) return 50;
  return 60;
}

/** CSEP-PATH / ACSM republished cut-points: toes for men, knees for women. Values are mins for Excellent, Very good, Good, Fair. */
const CSEP_PUSH: Record<"male" | "female", Record<number, [number, number, number, number]>> = {
  male: {
    15: [39, 29, 23, 18],
    20: [36, 29, 22, 17],
    30: [30, 22, 17, 12],
    40: [25, 17, 13, 10],
    50: [21, 13, 10, 7],
    60: [18, 11, 8, 5],
  },
  female: {
    15: [33, 25, 18, 12],
    20: [30, 21, 15, 10],
    30: [27, 20, 13, 8],
    40: [24, 15, 11, 5],
    50: [21, 11, 7, 2],
    60: [17, 12, 5, 2],
  },
};

function scoreFromCuts(value: number, cuts: [number, number, number, number]): DomainScore {
  if (value >= cuts[0]) return 5;
  if (value >= cuts[1]) return 4;
  if (value >= cuts[2]) return 3;
  if (value >= cuts[3]) return 2;
  return 1;
}

function scorePushups(
  reps: number,
  age: number | null,
  style: PushupStyle,
): { score: DomainScore; detail: string } {
  const band = ageBand(age);
  // CSEP tables are keyed by protocol: kneeling uses the women's table, toes the men's.
  const table = style === "knees" ? CSEP_PUSH.female : CSEP_PUSH.male;
  const cuts = table[band];
  const score = scoreFromCuts(reps, cuts);
  const protocol = style === "knees" ? "kneeling (CSEP women's protocol)" : "toes (CSEP men's protocol)";
  return {
    score,
    detail: `${reps} ${protocol}. CSEP-PATH / ACSM age band ${band}s.`,
  };
}

/** Enright & Sherrill 1998, healthy adults 40–80. */
function predicted6mwd(age: number, sex: Sex, heightCm: number, weightKg: number) {
  const men = 7.57 * heightCm - 5.02 * age - 1.76 * weightKg - 309;
  const women = 2.11 * heightCm - 2.29 * weightKg - 5.78 * age + 667;
  if (sex === "male") return men;
  if (sex === "female") return women;
  return (men + women) / 2;
}

function scoreWalkMeters(
  meters: number,
  age: number | null,
  sex: Sex,
  heightCm: number | null,
  weightKg: number | null,
): { score: DomainScore; detail: string } {
  if (age && heightCm && weightKg && age >= 40 && age <= 80) {
    const pred = predicted6mwd(age, sex, heightCm, weightKg);
    const pct = pred > 0 ? (meters / pred) * 100 : 0;
    const score: DomainScore = pct >= 110 ? 5 : pct >= 100 ? 4 : pct >= 85 ? 3 : pct >= 70 ? 2 : 1;
    return {
      score,
      detail: `${Math.round(meters)} m · ${Math.round(pct)}% of Enright predicted (${Math.round(pred)} m).`,
    };
  }
  const score: DomainScore = meters >= 650 ? 5 : meters >= 550 ? 4 : meters >= 450 ? 3 : meters >= 350 ? 2 : 1;
  return {
    score,
    detail: `${Math.round(meters)} m in 6 minutes (ATS 2002 protocol). No predicted equation — age/height/weight 40–80 needed.`,
  };
}

function scoreStep2(steps: number, age: number | null): { score: DomainScore; detail: string } {
  const senior = (age ?? 30) >= 60;
  const cuts: [number, number, number, number] = senior ? [110, 90, 70, 50] : [130, 110, 90, 70];
  return {
    score: scoreFromCuts(steps, cuts),
    detail: `${steps} steps in 2 minutes (Rikli & Jones in-place step).`,
  };
}

/** Rikli & Jones 1999 25th/50th/75th for 60–64 as the young-senior floor; younger adults use mixed-age means ~22–24. */
function scoreChair(reps: number, age: number | null, sex: Sex): { score: DomainScore; detail: string } {
  const a = age ?? 35;
  if (a >= 60) {
    const female = sex === "female" || sex === "unspecified";
    const p25 = a >= 85 ? (female ? 8 : 8) : a >= 75 ? (female ? 10 : 11) : a >= 70 ? (female ? 10 : 12) : female ? 12 : 14;
    const p50 = a >= 85 ? (female ? 10 : 11) : a >= 75 ? (female ? 12 : 14) : a >= 70 ? (female ? 13 : 14) : female ? 15 : 16;
    const p75 = a >= 85 ? (female ? 13 : 14) : a >= 75 ? (female ? 15 : 17) : a >= 70 ? (female ? 16 : 17) : female ? 17 : 19;
    const score: DomainScore = reps >= p75 + 2 ? 5 : reps >= p75 ? 4 : reps >= p50 ? 3 : reps >= p25 ? 2 : 1;
    return {
      score,
      detail: `${reps} stands in 30 s. Senior Fitness Test (Rikli & Jones 1999).`,
    };
  }
  const score: DomainScore = reps >= 28 ? 5 : reps >= 22 ? 4 : reps >= 16 ? 3 : reps >= 10 ? 2 : 1;
  return {
    score,
    detail: `${reps} stands in 30 s. Adult band around mixed-age means (~23).`,
  };
}

/** Strand et al. 2014 college plank means ~124 s men / 83 s women; McGill uses ~2 min as a strong clinical target. */
function scorePlank(seconds: number, age: number | null, sex: Sex): { score: DomainScore; detail: string } {
  const decade = Math.max(0, Math.floor(((age ?? 30) - 35) / 10));
  const shrink = 1 - Math.min(0.4, decade * 0.1);
  const excellent = (sex === "female" ? 120 : 150) * shrink;
  const vg = (sex === "female" ? 90 : 110) * shrink;
  const good = (sex === "female" ? 60 : 75) * shrink;
  const fair = (sex === "female" ? 30 : 40) * shrink;
  const score: DomainScore =
    seconds >= excellent ? 5 : seconds >= vg ? 4 : seconds >= good ? 3 : seconds >= fair ? 2 : 1;
  return {
    score,
    detail: `${seconds} s front plank. Strand 2014 / McGill trunk-endurance targets.`,
  };
}

/** Springer et al. 2007 unipedal stance, eyes open, best-of-3 means (45 s cap in their protocol). */
function slsMean(age: number | null) {
  const a = age ?? 30;
  if (a < 40) return 45;
  if (a < 50) return 42;
  if (a < 60) return 41;
  if (a < 70) return 32;
  if (a < 80) return 22;
  return 9;
}

function scoreSls(seconds: number, age: number | null): { score: DomainScore; detail: string } {
  const cap = Math.min(45, seconds);
  const mean = slsMean(age);
  const ratio = mean > 0 ? cap / mean : 0;
  const score: DomainScore =
    cap < 5 ? 1 : cap < 10 && (age ?? 30) >= 60 ? 1 : ratio >= 1 ? 5 : ratio >= 0.8 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.3 ? 2 : 1;
  return {
    score,
    detail: `${cap} s single-leg, eyes open. Springer 2007 age mean ~${mean} s.`,
  };
}

function scoreMobility(
  squat: 1 | 2 | 3 | null,
  shoulder: 1 | 2 | 3 | null,
): { score: DomainScore | null; detail: string; skipped: boolean } {
  const parts: number[] = [];
  const bits: string[] = [];
  if (squat) {
    parts.push(squat === 3 ? 5 : squat === 2 ? 3 : 1);
    bits.push(squat === 3 ? "squat looks clean" : squat === 2 ? "squat with compensation" : "can't squat to parallel with arms up");
  }
  if (shoulder) {
    parts.push(shoulder === 3 ? 5 : shoulder === 2 ? 3 : 1);
    bits.push(shoulder === 3 ? "hands meet on the back-scratch" : shoulder === 2 ? "near-miss on the back-scratch" : "can't reach the opposite scapula");
  }
  if (!parts.length) return { score: null, skipped: true, detail: "Skipped." };
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
  const score = Math.max(1, Math.min(5, Math.round(avg))) as DomainScore;
  return { score, skipped: false, detail: bits.join("; ") + "." };
}

function overallTier(scores: DomainScore[]): FitnessTier | null {
  if (!scores.length) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg < 2) return "foundation";
  if (avg < 3) return "developing";
  if (avg < 4) return "trained";
  return "strong";
}

function experienceFor(tier: FitnessTier | null): Experience {
  if (tier === "strong") return "advanced";
  if (tier === "trained") return "intermediate";
  return "novice";
}

function domain(
  id: DomainResult["id"],
  scored: { score: DomainScore; detail: string } | null,
  skipped: boolean,
): DomainResult {
  return {
    id,
    name: DOMAIN_LABEL[id],
    score: skipped ? null : scored?.score ?? null,
    skipped,
    detail: skipped ? "Skipped." : scored?.detail ?? "",
  };
}

export function scoreAssessment(input: AssessmentInput, takenAt = new Date().toISOString()): AssessmentResult {
  if (input.parqStop || input.skippedAll) {
    const domains: DomainResult[] = (["aerobic", "push", "lower", "core", "balance", "mobility"] as const).map((id) =>
      domain(id, null, true),
    );
    const summary = input.parqStop
      ? "Safety stop. No field tests. Sessions stay on the novice template until a clinician clears exercise and you retake this."
      : "No tests logged. Sessions use the standard starting template. Retake when you can.";
    return {
      takenAt,
      input,
      domains,
      overall: null,
      experience: "novice",
      summary,
      planNotes: [
        "No baseline scores — RPE and swaps stay at the program default.",
        "Retake the fitness check under You when you have 15 quiet minutes.",
      ],
    };
  }

  const aerobicSkipped = input.aerobicMode === "skip" || (input.aerobicMode === "walk6" && input.walkMeters == null) || (input.aerobicMode === "step2" && input.stepCount == null);
  const aerobic =
    input.aerobicMode === "walk6" && input.walkMeters != null
      ? scoreWalkMeters(input.walkMeters, input.age, input.sex, input.heightCm, input.weightKg)
      : input.aerobicMode === "step2" && input.stepCount != null
        ? scoreStep2(input.stepCount, input.age)
        : null;

  const push = input.pushups != null ? scorePushups(input.pushups, input.age, input.pushupStyle) : null;
  const lower = input.chairStand != null ? scoreChair(input.chairStand, input.age, input.sex) : null;
  const core = input.plankSeconds != null ? scorePlank(input.plankSeconds, input.age, input.sex) : null;
  const balance = input.singleLegSeconds != null ? scoreSls(input.singleLegSeconds, input.age) : null;
  const mobility = scoreMobility(input.squatQuality, input.shoulderReach);

  const domains: DomainResult[] = [
    domain("aerobic", aerobic, aerobicSkipped),
    domain("push", push, input.pushups == null),
    domain("lower", lower, input.chairStand == null),
    domain("core", core, input.plankSeconds == null),
    domain("balance", balance, input.singleLegSeconds == null),
    { id: "mobility", name: DOMAIN_LABEL.mobility, score: mobility.score, skipped: mobility.skipped, detail: mobility.detail },
  ];

  const scores = domains.map((d) => d.score).filter((s): s is DomainScore => s != null);
  const overall = overallTier(scores);
  const experience = experienceFor(overall);
  const summary = overall
    ? `Holistic band: ${overall}. ${scores.length} of 6 domains scored. Programming uses this, not a 1RM.`
    : "Not enough tests to score an overall band.";

  return {
    takenAt,
    input,
    domains,
    overall,
    experience,
    summary,
    planNotes: [],
  };
}
