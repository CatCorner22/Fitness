import { generateText, Output } from "ai";
import type { ProfileRow } from "@/lib/auth";
import { suggestNextLoad } from "@/lib/autoregulation";
import { getExercise } from "@/lib/exercises/registry";
import { formatKnowledgeForPrompt, searchKnowledge } from "@/lib/knowledge/search";
import { aiEnabled, DEFAULT_MODEL, LiveAdviceSchema, spiritSystemPrompt, type LiveAdvice } from "./spirit";

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
};

function fallbackLiveAdvice(req: LiveAdviceRequest): LiveAdvice {
  const ex = getExercise(req.exerciseId);
  const baseRest = ex?.restSeconds ?? 90;
  const load = suggestNextLoad({
    lastWeightKg: req.weightKg,
    lastRpe: req.rpe,
    lastReps: req.reps,
    targetRpe: req.targetRpe,
    targetReps: req.targetReps,
  });

  let restSeconds = baseRest;
  let nextAction: LiveAdvice["nextAction"] = "repeat_load";
  let weightDeltaKg: number | null = null;
  let mood: LiveAdvice["mood"] = "encouraging";

  if (req.rpe != null && req.rpe >= (req.targetRpe ?? 8) + 1) {
    restSeconds = Math.min(240, baseRest + 45);
    nextAction = "drop_weight";
    weightDeltaKg = req.weightKg != null ? -Math.max(2.5, req.weightKg * 0.05) : null;
    mood = "caution";
  } else if (req.rpe != null && req.rpe <= (req.targetRpe ?? 8) - 1) {
    nextAction = "add_weight";
    weightDeltaKg = ex?.pattern === "isolation" ? 1.25 : 2.5;
    mood = "proud";
  }

  if (req.elapsedMinutes > req.sessionMinutesBudget - 5 && req.remainingExercises > 2) {
    restSeconds = Math.max(60, baseRest - 30);
  }

  const articles = searchKnowledge({
    exerciseId: req.exerciseId,
    muscles: ex?.primaryMuscles,
    goal: req.profile.goal,
    programId: req.profile.activeProgramId ?? undefined,
    injuries: req.profile.injuries,
    query: "rest rpe",
    limit: 3,
  });

  const message = aiEnabled()
    ? load.reason
    : `*soft paw tap* ${load.reason} Rest ${Math.round(restSeconds / 60)}:${String(restSeconds % 60).padStart(2, "0")} — I'll watch the clock for you, nya~`;

  return {
    message,
    restSeconds,
    nextAction,
    weightDeltaKg,
    swapToExerciseId: null,
    mood,
    citeIds: articles.map((a) => a.id),
  };
}

export async function generateLiveAdvice(req: LiveAdviceRequest): Promise<LiveAdvice & { source: "llm" | "rules" }> {
  const ex = getExercise(req.exerciseId);
  const articles = searchKnowledge({
    exerciseId: req.exerciseId,
    muscles: ex?.primaryMuscles,
    goal: req.profile.goal,
    programId: req.profile.activeProgramId ?? undefined,
    injuries: req.profile.injuries,
    tags: req.rpe != null && req.rpe >= 9 ? ["deload", "rest"] : ["rest", "rpe"],
    query: `${req.exerciseName} set ${req.setIndex + 1} rpe ${req.rpe ?? ""}`,
    limit: 5,
  });

  if (!aiEnabled()) {
    return { ...fallbackLiveAdvice(req), source: "rules" };
  }

  try {
    const swapList = req.allowedSwapIds.join(", ") || "none";
    const result = await generateText({
      model: DEFAULT_MODEL,
      output: Output.object({ schema: LiveAdviceSchema }),
      system: spiritSystemPrompt({
        persona: req.profile.persona,
        knowledgeBlock: formatKnowledgeForPrompt(articles),
        registryBlock: `Allowed swap IDs for this exercise: ${swapList}`,
        live: true,
      }),
      prompt: `Live set logged:
Exercise: ${req.exerciseName} (${req.exerciseId})
Set ${req.setIndex + 1} of ${req.totalSets}
Target: ${req.targetReps} @ RPE ${req.targetRpe}
Logged: ${req.weightKg ?? "?"} kg × ${req.reps ?? "?"} reps @ RPE ${req.rpe ?? "?"}
Injuries: ${req.profile.injuries.join(", ") || "none"}
Session: ${req.elapsedMinutes}/${req.sessionMinutesBudget} min used, ${req.remainingExercises} exercises left
Program: ${req.profile.activeProgramId}, week ${req.profile.currentWeek}

Return Spirit's coaching with restSeconds and nextAction. If shoulder/knee/low_back injury flags match a painful pattern, suggest swap from allowed list only.`,
    });

    const parsed = result.output;
    if (parsed.swapToExerciseId && !req.allowedSwapIds.includes(parsed.swapToExerciseId)) {
      parsed.swapToExerciseId = null;
      parsed.nextAction = parsed.nextAction === "swap_exercise" ? "repeat_load" : parsed.nextAction;
    }
    return { ...parsed, source: "llm" };
  } catch (err) {
    console.error("Spirit LLM live advice failed:", err);
    return { ...fallbackLiveAdvice(req), source: "rules" };
  }
}

export async function generateChatReply(options: {
  profile: ProfileRow;
  question: string;
  contextSummary: string;
}) {
  const articles = searchKnowledge({
    query: options.question,
    goal: options.profile.goal,
    programId: options.profile.activeProgramId ?? undefined,
    injuries: options.profile.injuries,
    limit: 6,
  });

  if (!aiEnabled()) {
    return {
      text: `${options.contextSummary}\n\n*(Spirit is in offline mode — add AI_GATEWAY_API_KEY for full LLM coaching.)*\n\n${formatKnowledgeForPrompt(articles.slice(0, 2))}`,
      source: "rules" as const,
      citeIds: articles.map((a) => a.id),
    };
  }

  try {
    const result = await generateText({
      model: DEFAULT_MODEL,
      system: spiritSystemPrompt({
        persona: options.profile.persona,
        knowledgeBlock: formatKnowledgeForPrompt(articles),
        registryBlock: "Only recommend exercises from the Garanimal registry.",
      }),
      prompt: `User context:\n${options.contextSummary}\n\nUser question: ${options.question}`,
    });
    return {
      text: result.text,
      source: "llm" as const,
      citeIds: articles.map((a) => a.id),
    };
  } catch (err) {
    console.error("Spirit chat failed:", err);
    return {
      text: `${options.contextSummary}\n\nI lost signal mid-pounce. Here's what the knowledge base says:\n\n${formatKnowledgeForPrompt(articles.slice(0, 2))}`,
      source: "rules" as const,
      citeIds: articles.map((a) => a.id),
    };
  }
}
