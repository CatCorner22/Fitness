import { getExercise, recommendedExercises } from "@/lib/exercises/registry";
import { getProgram } from "@/lib/programs/catalog";
import { KNOWLEDGE_ARTICLES, type KnowledgeArticle } from "./articles";

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

function scoreArticle(article: KnowledgeArticle, ctx: SearchContext) {
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
      if (ctx.programId === "pole_stage" && article.id === "pole-prep") score += 8;
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
  return score;
}

export function searchKnowledge(ctx: SearchContext): KnowledgeArticle[] {
  const limit = ctx.limit ?? 5;
  return [...KNOWLEDGE_ARTICLES]
    .map((article) => ({ article, score: scoreArticle(article, ctx) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.article);
}

export function formatKnowledgeForPrompt(articles: KnowledgeArticle[]) {
  if (!articles.length) return "No specific articles matched.";
  return articles
    .map(
      (a) =>
        `[${a.id}] ${a.title}\n${a.summary}\n${a.body}${a.citations?.length ? `\nSources: ${a.citations.join("; ")}` : ""}`,
    )
    .join("\n\n---\n\n");
}

export function exerciseFactsForPrompt(exerciseId: string, allowedSwapIds: string[]) {
  const ex = getExercise(exerciseId);
  if (!ex) return "";
  const swaps = allowedSwapIds
    .map((id) => getExercise(id))
    .filter(Boolean)
    .map((s) => `${s!.id}: ${s!.name}`)
    .join(", ");
  return `Current exercise: ${ex.name} (${ex.id})
Pattern: ${ex.pattern}
Primary: ${ex.primaryMuscles.join(", ")}
Safety: ${ex.safety}
Note: ${ex.safetyNote}
Allowed swaps ONLY: ${swaps || "none listed"}`;
}

export function registrySummary() {
  const rec = recommendedExercises();
  return `${rec.length} approved exercises. Banned: bench-dip, behind-neck-press, behind-neck-pulldown, upright-row-chin, kipping-pullup.`;
}
