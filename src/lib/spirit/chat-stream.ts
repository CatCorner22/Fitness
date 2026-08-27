import type { ProfileRow } from "@/lib/auth";
import { formatKnowledgeForPrompt, registrySummary, searchKnowledgeAsync } from "@/lib/knowledge/search";
import type { KnowledgeArticle } from "@/lib/knowledge/articles";
import { historyForUser } from "@/lib/coach/engine";
import { buildCoachContextSummary } from "./context";
import { parseCoachMeta } from "./client-utils";
import { spiritSystemPrompt } from "./prompts";
import { modelForTier } from "./provider";

async function loadSpiritArticles(profile: ProfileRow, query: string, limit: number) {
  return searchKnowledgeAsync({
    query,
    goal: profile.goal,
    programId: profile.activeProgramId ?? undefined,
    injuries: profile.injuries,
    limit,
  });
}

function spiritSystemFor(profile: ProfileRow, articles: KnowledgeArticle[]) {
  return spiritSystemPrompt({
    persona: profile.persona,
    knowledgeBlock: formatKnowledgeForPrompt(articles),
    registryBlock: registrySummary(),
  });
}

async function prepareSpiritStream(
  profile: ProfileRow,
  contextBlock: string,
  userPrompt: string,
  query: string,
  limit: number,
) {
  const articles = await loadSpiritArticles(profile, query, limit);
  return {
    system: spiritSystemFor(profile, articles),
    prompt: `User context:\n${contextBlock}\n\n${userPrompt}`,
    citeIds: articles.map((a) => a.id),
  };
}

export async function prepareSpiritChatStream(profile: ProfileRow, userId: string, question: string) {
  const contextSummary = buildCoachContextSummary(userId, profile);
  const history = historyForUser(userId)
    .slice(-6)
    .map((m) => parseCoachMeta(m.content).text);
  const historyBlock = history.length ? `Recent conversation themes:\n${history.join("\n---\n")}\n\n` : "";
  const prepared = await prepareSpiritStream(
    profile,
    contextSummary,
    `${historyBlock}User question: ${question}`,
    question,
    8,
  );
  return { ...prepared, contextSummary };
}

export async function prepareSpiritBriefingStream(profile: ProfileRow, _userId: string, todaySummary: string) {
  const prepared = await prepareSpiritStream(
    profile,
    todaySummary,
    "Give a concise daily training briefing (3–5 sentences): today's session focus, deload/fatigue read, one actionable tip. Kawaii snow leopard tone, evidence-backed.",
    "daily training briefing deload fatigue",
    6,
  );
  return { ...prepared, model: modelForTier("chat") };
}
