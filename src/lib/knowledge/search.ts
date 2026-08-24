import { getExercise, recommendedExercises } from "@/lib/exercises/registry";
import { hybridSearchKnowledge } from "@/lib/spirit/embeddings";
import { KNOWLEDGE_ARTICLES, type KnowledgeArticle } from "./articles";
import { scoreArticle, type SearchContext } from "./scoring";

export type { SearchContext };

export function searchKnowledge(ctx: SearchContext): KnowledgeArticle[] {
  const limit = ctx.limit ?? 5;
  return [...KNOWLEDGE_ARTICLES]
    .map((article) => ({ article, score: scoreArticle(article, ctx) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.article);
}

/** Async hybrid retrieval — keyword + HF MiniLM embeddings when HF_TOKEN is set. */
export async function searchKnowledgeAsync(ctx: SearchContext): Promise<KnowledgeArticle[]> {
  return hybridSearchKnowledge(ctx);
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
