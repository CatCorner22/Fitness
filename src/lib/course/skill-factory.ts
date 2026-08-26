import { NYX } from "./instructor";
import { stillForSkill } from "./skill-stills";
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
  const still = stillForSkill(input.id);
  return {
    ...input,
    photo: input.photo ?? NYX.photos[still],
    plate: input.plate ?? NYX.plates[still],
    audio: input.audio ?? `/instructor/audio/${input.id}.mp3`,
    video: input.video ?? `/instructor/video/${input.id}.mp4?v=6`,
  };
}
