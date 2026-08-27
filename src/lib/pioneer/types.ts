export const PIONEER_NAME = "Pioneer";
export const PIONEER_PROMPT_VERSION = "1.0.0";

export const PIONEER_DISCLAIMER =
  "Experimental guide only. Pioneer does not edit this draft. You stay responsible for training and food. Not medical advice.";

export const PIONEER_UNAVAILABLE =
  "Pioneer is unavailable. Instruments still read.";

export type PioneerKind = "training" | "nutrition" | "mixed";

export type PioneerLayer = "instrument" | "pioneer";

export type PioneerStatus =
  | "waiting"
  | "reading"
  | "instrument"
  | "pioneer"
  | "refused"
  | "dark"
  | "unavailable";

export type PioneerMood = "on_course" | "drift" | "caution" | "thinking" | "dark";

export type PioneerAbout = "existing" | "gap" | "alignment";

export type PioneerProfileId = "standard" | "caution" | "strict";

export type PioneerGaugeId = "stimulus" | "fuel" | "recovery" | "safety" | "adherence";

export type PioneerObservation = {
  id: string;
  layer: PioneerLayer;
  what: string;
  why: string;
  question?: string;
  source: string;
  quote?: string;
  about: PioneerAbout;
};

export type PioneerGauge = {
  id: PioneerGaugeId;
  label: string;
  value: number;
  applicable: boolean;
  note: string;
};

export type PioneerGauges = {
  stimulus: PioneerGauge;
  fuel: PioneerGauge;
  recovery: PioneerGauge;
  safety: PioneerGauge;
  adherence: PioneerGauge;
  onCourse: number;
  rails: PioneerGaugeId[];
};

export type PioneerProfile = {
  id: PioneerProfileId;
  minReads: number;
  unanimous: boolean;
  allowInternalRewrite: boolean;
};

export type PioneerHousehold = {
  goal: string;
  experience: string;
  daysPerWeek: number;
  sessionMinutes: number;
  injuries: string[];
  dietId: string | null;
  dietPhase: string | null;
  dietName: string | null;
  calorieTarget: number;
  proteinTarget: number;
  calorieFloor: number;
  sex: "female" | "male" | "unspecified";
  weightKg: number | null;
  fatigue: number | null;
  sleepHours: number | null;
  todayCalories: number;
  todayProtein: number;
  programId: string | null;
  programName: string | null;
  lowHistamine: boolean;
  peakDiet: boolean;
  deload: boolean;
};

export type PioneerDraftRecord = {
  id: string;
  title: string;
  body: string;
  kind: PioneerKind;
  updatedAt: string;
};

export type PioneerObserveResult = {
  status: PioneerStatus;
  layer: PioneerLayer;
  observations: PioneerObservation[];
  gauges: PioneerGauges;
  mood: PioneerMood;
  profile: PioneerProfileId;
  reads: number;
  corroboration?: { seen: number; reads: number };
  promptVersion: string;
  statusLine: string;
};
