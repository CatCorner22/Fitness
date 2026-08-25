import type { Experience, Sex } from "@/lib/types";

export type DomainId = "aerobic" | "push" | "lower" | "core" | "balance" | "mobility";
export type DomainScore = 1 | 2 | 3 | 4 | 5;
export type FitnessTier = "foundation" | "developing" | "trained" | "strong";
export type PushupStyle = "toes" | "knees";
export type AerobicMode = "walk6" | "step2" | "skip";

export type DomainResult = {
  id: DomainId;
  name: string;
  score: DomainScore | null;
  skipped: boolean;
  detail: string;
};

export type AssessmentInput = {
  age: number | null;
  sex: Sex;
  heightCm: number | null;
  weightKg: number | null;
  parqStop: boolean;
  skippedAll: boolean;
  aerobicMode: AerobicMode;
  walkMeters: number | null;
  stepCount: number | null;
  pushups: number | null;
  pushupStyle: PushupStyle;
  chairStand: number | null;
  plankSeconds: number | null;
  singleLegSeconds: number | null;
  squatQuality: 1 | 2 | 3 | null;
  shoulderReach: 1 | 2 | 3 | null;
};

export type AssessmentResult = {
  takenAt: string;
  input: AssessmentInput;
  domains: DomainResult[];
  overall: FitnessTier | null;
  experience: Experience;
  summary: string;
  planNotes: string[];
};

export type FitnessPlanAdjust = {
  rpeAdjust: number;
  accessorySetAdjust: number;
  restMultiplier: number;
  squatSwap: "goblet-squat" | "box-squat" | null;
  pressSwap: "db-shoulder-press" | "landmine-press" | null;
  avoidSingleLeg: boolean;
  easyCardio: boolean;
  addPlank: boolean;
  addWalk: boolean;
  notes: string[];
};

export const DOMAIN_LABEL: Record<DomainId, string> = {
  aerobic: "Aerobic",
  push: "Upper endurance",
  lower: "Lower body",
  core: "Core",
  balance: "Balance",
  mobility: "Mobility",
};

export const TIER_LABEL: Record<FitnessTier, string> = {
  foundation: "Foundation",
  developing: "Developing",
  trained: "Trained",
  strong: "Strong",
};

export const SCORE_LABEL: Record<DomainScore, string> = {
  1: "Needs work",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};
