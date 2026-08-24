import type { ProfileRow } from "@/lib/auth";
import { historyForUser } from "@/lib/coach/engine";
import { formatKnowledgeForPrompt, registrySummary, searchKnowledgeAsync } from "@/lib/knowledge/search";
import { spiritSystemPrompt } from "./prompts";
import { modelForTier } from "./provider";
import { buildCoachContextSummary } from "./context";

export async function prepareSpiritChatStream(profile: ProfileRow, userId: string, question: string) {
  const articles = await searchKnowledgeAsync({
    query: question,
    goal: profile.goal,
    programId: profile.activeProgramId ?? undefined,
    injuries: profile.injuries,
    limit: 8,
  });

  const contextSummary = buildCoachContextSummary(userId, profile);
  const history = historyForUser(userId)
    .slice(-6)
    .map((m) => m.content.replace(/\n\n<!-- spirit-meta:[\s\S]* -->$/, ""));

  const system = spiritSystemPrompt({
    persona: profile.persona,
    knowledgeBlock: formatKnowledgeForPrompt(articles),
    registryBlock: registrySummary(),
  });

  const prompt = `User context:\n${contextSummary}\n\n${
    history.length ? `Recent conversation themes:\n${history.join("\n---\n")}\n\n` : ""
  }User question: ${question}`;

  return {
    system,
    prompt,
    citeIds: articles.map((a) => a.id),
    contextSummary,
  };
}

export async function prepareSpiritBriefingStream(profile: ProfileRow, userId: string, todaySummary: string) {
  const articles = await searchKnowledgeAsync({
    query: "daily training briefing deload fatigue",
    goal: profile.goal,
    programId: profile.activeProgramId ?? undefined,
    injuries: profile.injuries,
    limit: 6,
  });

  const system = spiritSystemPrompt({
    persona: profile.persona,
    knowledgeBlock: formatKnowledgeForPrompt(articles),
    registryBlock: registrySummary(),
  });

  const prompt = `User context:\n${todaySummary}\n\nGive a concise daily training briefing (3–5 sentences): today's session focus, deload/fatigue read, one actionable tip. Kawaii snow leopard tone, evidence-backed.`;

  return { system, prompt, citeIds: articles.map((a) => a.id), model: modelForTier("chat") };
}
