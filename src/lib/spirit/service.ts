import { generateText, Output } from "ai";
import type { ProfileRow } from "@/lib/auth";
import { shouldDeload } from "@/lib/autoregulation";
import { getExercise } from "@/lib/exercises/registry";
import {
  exerciseFactsForPrompt,
  formatKnowledgeForPrompt,
  registrySummary,
  searchKnowledgeAsync,
} from "@/lib/knowledge/search";
import { getArticle } from "@/lib/knowledge/articles";
import {
  gaugesToMood,
  instrumentAdvice,
  measureGauges,
  parseContextFor,
  type SpiritInstrumentAdvice,
} from "./advisor";
import { aiEnabled, getSpiritConfig, resolveReads, SPIRIT_UNAVAILABLE } from "./config";
import { modelForTier, modelLabel } from "./provider";
import { spiritSystemPrompt, SPIRIT_PROMPT_VERSION } from "./prompts";
import { resolveModes, resolveProfile, strictPromptAddendum } from "./router";
import { SpiritChatSchema, SpiritLiveAdviceSchema, type SpiritLiveAdvice } from "./schemas";

export type LiveAdviceRequest = {
  profile: ProfileRow;
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  setIndex: number;
  totalSets: number;
  targetReps: string;
  targetRpe: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  allowedSwapIds: string[];
  sessionMinutesBudget: number;
  elapsedMinutes: number;
  remainingExercises: number;
  priorSets?: { weightKg: number | null; reps: number | null; rpe: number | null; setIndex: number }[];
  fatigue?: number | null;
};

export type SpiritLiveResult = SpiritLiveAdvice & {
  source: "llm" | "rules";
  why: string;
  promptVersion: string;
  modes: string[];
  profile: string;
  reads: number;
  corroboration?: { seen: number; reads: number };
  gauges?: ReturnType<typeof measureGauges>;
};

function validateAdvice(
  advice: SpiritLiveAdvice,
  allowedSwapIds: string[],
): SpiritLiveAdvice | null {
  if (advice.swapToExerciseId && !allowedSwapIds.includes(advice.swapToExerciseId)) {
    advice.swapToExerciseId = null;
    if (advice.nextAction === "swap_exercise") advice.nextAction = "repeat_load";
  }
  advice.citeIds = advice.citeIds.filter((id) => Boolean(getArticle(id)));
  const banned = ["bench dip", "chair dip", "bar dip", "behind-the-neck", "kipping"];
  const lower = advice.message.toLowerCase();
  if (banned.some((b) => lower.includes(b) && !lower.includes("banned") && !lower.includes("avoid"))) {
    return null;
  }
  return advice;
}

function consensusKey(a: SpiritLiveAdvice): string {
  return `${a.nextAction}|${a.restSeconds}|${Math.round((a.weightDeltaKg ?? 0) * 10)}`;
}

const READ_LENSES = [
  "Focus this read on REST timing and RPE autoregulation for the next set.",
  "Focus this read on LOAD progression or regression given logged performance.",
  "Focus this read on SAFE SWAPS and injury-aware exercise selection.",
] as const;

async function readLiveOnce(
  system: string,
  prompt: string,
  lens: string,
): Promise<SpiritLiveAdvice | null> {
  try {
    const result = await generateText({
      model: modelForTier("live"),
      output: Output.object({ schema: SpiritLiveAdviceSchema }),
      system,
      prompt: `${prompt}\n\n${lens}\n\nReturn structured coaching with restSeconds, nextAction, why, and citeIds from the knowledge base.`,
    });
    return result.output;
  } catch {
    return null;
  }
}

function mergeConsensus(
  results: SpiritLiveAdvice[],
  profile: ReturnType<typeof resolveProfile>,
): { advice: SpiritLiveAdvice; corroboration?: { seen: number; reads: number } } | null {
  const n = results.length;
  const needed = profile.unanimous ? n : Math.floor(n / 2) + 1;
  const byKey = new Map<string, { s: SpiritLiveAdvice; seen: number }>();
  for (const s of results) {
    const key = consensusKey(s);
    const existing = byKey.get(key);
    if (existing) existing.seen += 1;
    else byKey.set(key, { s, seen: 1 });
  }
  let best: { s: SpiritLiveAdvice; seen: number } | null = null;
  for (const entry of byKey.values()) {
    if (entry.seen < needed) continue;
    if (!best || entry.seen > best.seen) best = entry;
  }
  if (!best) return null;
  return {
    advice: best.s,
    corroboration: n > 1 ? { seen: best.seen, reads: n } : undefined,
  };
}

function toInstrumentResult(
  inst: SpiritInstrumentAdvice,
  modes: string[],
  profile: string,
  gauges: ReturnType<typeof measureGauges>,
): SpiritLiveResult {
  return {
    ...inst,
    source: "rules",
    promptVersion: SPIRIT_PROMPT_VERSION,
    modes,
    profile,
    reads: 0,
    gauges,
  };
}

export async function runSpiritLiveAdvice(req: LiveAdviceRequest): Promise<SpiritLiveResult> {
  const ex = getExercise(req.exerciseId);
  const deload = shouldDeload(req.profile.userId);
  const modes = resolveModes({
    injuries: req.profile.injuries,
    fatigue: req.fatigue,
    rpe: req.rpe,
    targetRpe: req.targetRpe,
    elapsedMinutes: req.elapsedMinutes,
    sessionMinutesBudget: req.sessionMinutesBudget,
    remainingExercises: req.remainingExercises,
    deloadRecommended: deload.deload,
    exerciseSafety: ex?.safety,
  });
  const profile = resolveProfile(modes);
  const gauges = measureGauges(req);

  const articles = await searchKnowledgeAsync({
    exerciseId: req.exerciseId,
    exerciseName: req.exerciseName,
    muscles: ex?.primaryMuscles,
    goal: req.profile.goal,
    programId: req.profile.activeProgramId ?? undefined,
    injuries: req.profile.injuries,
    tags: req.rpe != null && req.rpe >= 9 ? ["deload", "rest"] : ["rest", "rpe"],
    query: `${req.exerciseName} set ${req.setIndex + 1} rpe ${req.rpe ?? ""}`,
    limit: 6,
  });

  const citeIds = articles.map((a) => a.id);
  const instrument = instrumentAdvice({ ...req, modes, citeIds });
  const modeLabels = modes;
  const profileId = profile.id;

  if (!aiEnabled()) {
    return toInstrumentResult(instrument, modeLabels, profileId, gauges);
  }

  const parseContext = parseContextFor({
    exerciseId: req.exerciseId,
    exerciseName: req.exerciseName,
    priorSets: req.priorSets ?? [],
    setIndex: req.setIndex,
    totalSets: req.totalSets,
    targetReps: req.targetReps,
    targetRpe: req.targetRpe,
    weightKg: req.weightKg,
    reps: req.reps,
    rpe: req.rpe,
    modes,
  });

  const system = spiritSystemPrompt({
    persona: req.profile.persona,
    knowledgeBlock: formatKnowledgeForPrompt(articles),
    registryBlock: `${registrySummary()}\n${exerciseFactsForPrompt(req.exerciseId, req.allowedSwapIds)}`,
    parseContext,
    strictAddendum: strictPromptAddendum(modes),
    live: true,
  });

  const prompt = `Live set logged. Return Spirit's coaching with restSeconds, nextAction, why, and citeIds.
Allowed swap IDs: ${req.allowedSwapIds.join(", ") || "none"}
Injuries: ${req.profile.injuries.join(", ") || "none"}
Program: ${req.profile.activeProgramId}, week ${req.profile.currentWeek}`;

  const cfg = getSpiritConfig();
  const reads = Math.max(resolveReads(), profile.minReads, cfg.reads > 1 ? cfg.reads : 0);
  const effectiveReads = Math.min(3, Math.max(1, reads));

  const rawResults: SpiritLiveAdvice[] = [];
  for (let i = 0; i < effectiveReads; i++) {
    const raw = await readLiveOnce(system, prompt, READ_LENSES[i % READ_LENSES.length]!);
    if (raw) {
      const validated = validateAdvice(raw, req.allowedSwapIds);
      if (validated) rawResults.push(validated);
    }
  }

  if (rawResults.length === 0) {
    console.error("Spirit LLM live advice failed — falling back to instrument");
    return toInstrumentResult(instrument, modeLabels, profileId, gauges);
  }

  const merged =
    rawResults.length === 1
      ? { advice: rawResults[0]!, corroboration: undefined }
      : mergeConsensus(rawResults, profile);

  if (!merged) {
    return toInstrumentResult(instrument, modeLabels, profileId, gauges);
  }

  return {
    ...merged.advice,
    mood: merged.advice.mood ?? gaugesToMood(gauges, modes),
    source: "llm",
    promptVersion: SPIRIT_PROMPT_VERSION,
    modes: modeLabels,
    profile: profileId,
    reads: rawResults.length,
    corroboration: merged.corroboration,
    gauges,
  };
}

export async function runSpiritChatReply(options: {
  profile: ProfileRow;
  question: string;
  contextSummary: string;
  history?: { role: "user" | "coach"; content: string }[];
}) {
  const articles = await searchKnowledgeAsync({
    query: options.question,
    goal: options.profile.goal,
    programId: options.profile.activeProgramId ?? undefined,
    injuries: options.profile.injuries,
    limit: 8,
  });

  if (!aiEnabled()) {
    return {
      text: `${options.contextSummary}\n\n*(Spirit is in offline mode — add AI_GATEWAY_API_KEY or HF_TOKEN.)*\n\n${formatKnowledgeForPrompt(articles.slice(0, 2))}`,
      source: "rules" as const,
      citeIds: articles.map((a) => a.id),
      mood: "encouraging" as const,
      promptVersion: SPIRIT_PROMPT_VERSION,
    };
  }

  const historyBlock =
    options.history?.length ?
      options.history
        .slice(-8)
        .map((m) => `${m.role === "user" ? "User" : "Spirit"}: ${m.content}`)
        .join("\n")
    : "";

  try {
    const result = await generateText({
      model: modelForTier("chat"),
      output: Output.object({ schema: SpiritChatSchema }),
      system: spiritSystemPrompt({
        persona: options.profile.persona,
        knowledgeBlock: formatKnowledgeForPrompt(articles),
        registryBlock: registrySummary(),
      }),
      prompt: `User context:\n${options.contextSummary}\n\n${historyBlock ? `Recent chat:\n${historyBlock}\n\n` : ""}User question: ${options.question}`,
    });
    return {
      text: result.output.message,
      source: "llm" as const,
      citeIds: result.output.citeIds.filter((id) => Boolean(getArticle(id))),
      mood: result.output.mood ?? ("encouraging" as const),
      promptVersion: SPIRIT_PROMPT_VERSION,
    };
  } catch (err) {
    console.error("Spirit chat failed:", err);
    return {
      text: `${options.contextSummary}\n\n${SPIRIT_UNAVAILABLE}\n\n${formatKnowledgeForPrompt(articles.slice(0, 2))}`,
      source: "rules" as const,
      citeIds: articles.map((a) => a.id),
      mood: "caution" as const,
      promptVersion: SPIRIT_PROMPT_VERSION,
    };
  }
}

export async function runSpiritBriefing(options: {
  profile: ProfileRow;
  contextSummary: string;
}) {
  return runSpiritChatReply({
    profile: options.profile,
    question: "Give me a concise daily training briefing: program focus, fatigue/deload status, one actionable tip.",
    contextSummary: options.contextSummary,
  });
}

export { modelLabel, SPIRIT_PROMPT_VERSION };
