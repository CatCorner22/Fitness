export type Units = "lb" | "kg";
export type Persona = "scientist" | "garanimal";
export type Experience = "novice" | "intermediate" | "advanced";
export type Safety = "recommended" | "caution" | "banned";
export type Sex = "female" | "male" | "unspecified";

export type Muscle =
  | "glutes"
  | "quads"
  | "hamstrings"
  | "adductors"
  | "calves"
  | "chest"
  | "front_delts"
  | "side_delts"
  | "rear_delts"
  | "lats"
  | "upper_back"
  | "traps"
  | "triceps"
  | "biceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "spinal_erectors"
  | "hip_flexors"
  | "rotator_cuff"
  | "grip";

export type Pattern =
  | "squat"
  | "hinge"
  | "thrust"
  | "lunge"
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "carry"
  | "core"
  | "mobility"
  | "cardio"
  | "isolation";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "kettlebell"
  | "bands"
  | "bodyweight"
  | "pullup_bar"
  | "bench"
  | "hip_thrust_bench"
  | "trap_bar"
  | "landmine"
  | "sled"
  | "cardio_machine";

export type Injury = "shoulder" | "knee" | "low_back" | "wrist" | "elbow" | "hip";

export type Goal =
  | "powerlifting"
  | "bodybuilding"
  | "strength_endurance"
  | "pole_stage"
  | "glute_specialization"
  | "general";

export type ProgramId =
  | "powerlifting"
  | "conjugate"
  | "bro_split"
  | "ppl"
  | "upper_lower"
  | "strength_endurance"
  | "pole_stage"
  | "big_ass";

export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  safety: Safety;
  safetyNote: string;
  substitutes: string[];
  restSeconds: number;
  priority: 1 | 2 | 3 | 4 | 5;
  isCardio?: boolean;
  avoidIf?: Injury[];
}

export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  targetRpe: number;
  restSeconds?: number;
  optional?: boolean;
  priority: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  role?: "main" | "secondary" | "accessory" | "prehab" | "conditioning";
}

export interface ProgramDay {
  id: string;
  name: string;
  focus: string;
  kind: "lift" | "cardio" | "mixed" | "mobility";
  estimatedMinutes: number;
  exercises: TemplateExercise[];
}

export interface WeekPhase {
  weeks: number[];
  name: string;
  rpeAdjust: number;
  setAdjust: number;
  note: string;
}

export interface Program {
  id: ProgramId;
  name: string;
  tagline: string;
  category: string;
  daysPerWeek: number;
  durationWeeks: number;
  description: string;
  evidenceNote: string;
  honestNote?: string;
  recommendedFor: Goal[];
  days: ProgramDay[];
  phases: WeekPhase[];
}

export interface PlannedExercise extends TemplateExercise {
  exercise: Exercise;
  suggestedWeightKg: number | null;
  last?: { weightKg: number; reps: number; rpe: number | null };
}

export interface PlannedSession {
  program: Program;
  week: number;
  phase: WeekPhase;
  day: ProgramDay;
  exercises: PlannedExercise[];
  estimatedMinutes: number;
  trimmed: boolean;
  droppedExerciseIds: string[];
}