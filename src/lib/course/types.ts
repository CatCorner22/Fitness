export type DiagramKind =
  | "walk"
  | "wave"
  | "hip8"
  | "floor"
  | "tabletop"
  | "knee"
  | "chair"
  | "polewalk"
  | "fireman"
  | "sit"
  | "climb"
  | "hang"
  | "layer"
  | "phrase"
  | "circuit";

export type CourseId = "exotic_amateur_night" | "pole_class_intermediate";

export interface Skill {
  id: string;
  exerciseId: string;
  name: string;
  module: string;
  courseId: CourseId;
  level: "foundation" | "class" | "show";
  durationLabel: string;
  why: string;
  safety: string;
  bothSides?: boolean;
  cue: string;
  steps: string[];
  watchFor: string[];
  voiceScript: string;
  diagram: DiagramKind;
  photo: string;
  plate: string;
  video?: string;
  audio?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  weeks: string;
  intent: string;
  skillIds: string[];
}

export interface Course {
  id: CourseId;
  programId: string;
  name: string;
  tagline: string;
  adult: boolean;
  description: string;
  howToLearn: string[];
  modules: CourseModule[];
}
