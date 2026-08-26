/** Shared keyword scoring extracted from search.ts for hybrid retrieval. */

import { getExercise } from "@/lib/exercises/registry";
import { getProgram } from "@/lib/programs/catalog";
import type { KnowledgeArticle } from "./articles";

export type SearchContext = {
  query?: string;
  exerciseId?: string;
  exerciseName?: string;
  muscles?: string[];
  goal?: string;
  programId?: string;
  injuries?: string[];
  tags?: string[];
  limit?: number;
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

export function scoreArticle(article: KnowledgeArticle, ctx: SearchContext) {
  let score = 0;
  const hay = `${article.title} ${article.summary} ${article.body} ${article.tags.join(" ")}`.toLowerCase();
  const queryTokens = tokenize(ctx.query ?? "");
  for (const t of queryTokens) {
    if (hay.includes(t)) score += 3;
    if (article.tags.some((tag) => tag.includes(t))) score += 4;
  }
  for (const tag of ctx.tags ?? []) {
    if (article.tags.includes(tag)) score += 5;
  }
  if (ctx.goal) {
    const g = ctx.goal.toLowerCase();
    if (article.tags.some((t) => g.includes(t) || t.includes(g))) score += 4;
    if (hay.includes(g.replace("_", " "))) score += 2;
  }
  for (const muscle of ctx.muscles ?? []) {
    if (hay.includes(muscle.replace("_", " "))) score += 3;
    if (article.tags.includes(muscle)) score += 4;
  }
  for (const injury of ctx.injuries ?? []) {
    if (article.tags.includes(injury) || article.id === "shoulder-health" || article.id === "banned-exercises") {
      score += injury === "shoulder" ? 4 : 2;
    }
  }
  if (ctx.programId) {
    const program = getProgram(ctx.programId);
    if (program) {
      for (const tag of article.tags) {
        if (program.name.toLowerCase().includes(tag) || program.id.includes(tag)) score += 2;
      }
      if (ctx.programId === "big_ass" && article.id === "glute-science") score += 8;
      if (ctx.programId === "pole_stage" && (article.id === "pole-prep" || article.id === "nyx-udl")) score += 8;
      if (ctx.programId === "pole_amateur_night" && (article.id === "pole-prep" || article.id === "nyx-udl")) score += 8;
      if (ctx.programId === "smart_stretch" && article.id === "stretching-ergonomics") score += 8;
      if (ctx.programId === "home_yoga" && article.id === "stretching-ergonomics") score += 6;
      if (ctx.programId === "rucking" && article.id === "rucking-load") score += 8;
      if ((ctx.programId === "barre" || ctx.programId === "ballet_basics") && article.id === "turnout-alignment") score += 8;
      if (ctx.programId === "conjugate" && article.id === "conjugate-overview") score += 8;
      if (ctx.programId === "strength_endurance" && article.id === "concurrent-training") score += 8;
    }
  }
  if (ctx.exerciseId) {
    const ex = getExercise(ctx.exerciseId);
    if (ex) {
      if (ex.safety === "banned" && article.id === "banned-exercises") score += 10;
      if (ex.safety === "caution" && article.id === "shoulder-health") score += 3;
      for (const m of ex.primaryMuscles) {
        if (article.tags.includes(m)) score += 2;
      }
      if (ex.pattern === "thrust" && article.id === "glute-science") score += 5;
    }
  }
  if (ctx.query?.toLowerCase().includes("rest") && article.id === "rest-periods") score += 6;
  if (ctx.query?.toLowerCase().includes("rpe") && article.id === "rpe-rir") score += 6;
  if (
    (ctx.query?.toLowerCase().includes("assess") ||
      ctx.query?.toLowerCase().includes("baseline") ||
      ctx.query?.toLowerCase().includes("push-up") ||
      ctx.query?.toLowerCase().includes("6-minute")) &&
    article.id === "fitness-assessment"
  ) {
    score += 8;
  }
  if (
    (ctx.query?.toLowerCase().includes("fasting") ||
      ctx.query?.toLowerCase().includes("16:8") ||
      ctx.query?.toLowerCase().includes("tre") ||
      ctx.query?.toLowerCase().includes("eating window")) &&
    article.id === "time-restricted-eating"
  ) {
    score += 8;
  }
  if (
    (ctx.query?.toLowerCase().includes("fast food") ||
      ctx.query?.toLowerCase().includes("chick-fil") ||
      ctx.query?.toLowerCase().includes("chickfila") ||
      ctx.query?.toLowerCase().includes("chipotle") ||
      ctx.query?.toLowerCase().includes("drive-thru") ||
      ctx.query?.toLowerCase().includes("drive thru")) &&
    article.id === "fast-food-orders"
  ) {
    score += 10;
  }
  if (
    (ctx.query?.toLowerCase().includes("cut") ||
      ctx.query?.toLowerCase().includes("bulk") ||
      ctx.query?.toLowerCase().includes("reverse") ||
      ctx.query?.toLowerCase().includes("diet")) &&
    article.id === "diet-periodization"
  ) {
    score += 8;
  }
  if (
    (ctx.query?.toLowerCase().includes("histamine") ||
      ctx.query?.toLowerCase().includes("leftover") ||
      ctx.query?.toLowerCase().includes("dao") ||
      ctx.query?.toLowerCase().includes("fermented")) &&
    article.id === "low-histamine"
  ) {
    score += 10;
  }
  if (
    (ctx.query?.toLowerCase().includes("6%") ||
      ctx.query?.toLowerCase().includes("peak") ||
      ctx.query?.toLowerCase().includes("beach")) &&
    article.id === "peak-lean"
  ) {
    score += 8;
  }
  return score;
}
