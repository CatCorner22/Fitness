import { NYX } from "./instructor";
import type { CourseId, DiagramKind, Skill } from "./types";

export function makeSkill(input: {
  id: string;
  exerciseId: string;
  name: string;
  module: string;
  courseId: CourseId;
  level: Skill["level"];
  durationLabel: string;
  why: string;
  safety: string;
  bothSides?: boolean;
  cue: string;
  steps: string[];
  watchFor: string[];
  voiceScript: string;
  diagram: DiagramKind;
  photo?: string;
  plate?: string;
  video?: string;
  audio?: string;
  practice?: string;
  passWhen?: string;
  firstThen?: { first: string; then: string };
}): Skill {
  return {
    ...input,
    photo: input.photo ?? NYX.photos.portrait,
    plate: input.plate ?? NYX.plates.portrait,
    audio: input.audio ?? `/instructor/audio/${input.id}.mp3`,
    video: input.video ?? `/instructor/video/${input.id}.mp4`,
  };
}
