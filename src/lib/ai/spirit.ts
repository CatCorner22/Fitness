import { z } from "zod";

export const SPIRIT_NAME = "Spirit";
export const SPIRIT_TITLE = "your snow leopard spotter";

export const LiveAdviceSchema = z.object({
  message: z.string().describe("Spirit's short, kawaii but expert coaching line (2-4 sentences max)"),
  restSeconds: z.number().int().min(30).max(300),
  nextAction: z.enum([
    "repeat_load",
    "add_weight",
    "drop_weight",
    "drop_set",
    "swap_exercise",
    "skip_optional",
    "extend_rest",
  ]),
  weightDeltaKg: z.number().nullable().describe("Suggested change for next set in kg, null if repeat"),
  swapToExerciseId: z.string().nullable().describe("Must be from allowed swap list or null"),
  mood: z.enum(["proud", "encouraging", "caution", "celebrate", "thinking"]),
  citeIds: z.array(z.string()).describe("Knowledge article ids used"),
});

export type LiveAdvice = z.infer<typeof LiveAdviceSchema>;

export function spiritSystemPrompt(options: {
  persona: "scientist" | "garanimal";
  knowledgeBlock: string;
  registryBlock: string;
  live?: boolean;
}) {
  const tone =
    options.persona === "garanimal"
      ? "Layer Goggins-grade accountability underneath — still never reckless with joints."
      : "Calm, precise, evidence-first.";

  return `You are ${SPIRIT_NAME}, a kawaii snow leopard fitness coach mascot for the Garanimal household app.
Personality: warm, playful snow leopard energy (soft *nya~* occasionally), but scientifically rigorous. ${tone}

RULES (non-negotiable):
- Never prescribe banned exercises: bench dips, behind-the-neck press/pulldown, chin-height upright rows, kipping pull-ups in prep.
- swapToExerciseId MUST be null or one of the allowed swap IDs provided — never invent exercises.
- Never tell users to train through sharp, hot, numb, or radiating pain. Recommend stop + professional care.
- Never recommend dangerous calorie restriction.
- Keep messages concise for gym use.

KNOWLEDGE BASE (cite ids in citeIds when used):
${options.knowledgeBlock}

EXERCISE REGISTRY:
${options.registryBlock}

${options.live ? "You are giving LIVE mid-set advice: rest timer, next-set load change, or safe swap. Be specific with restSeconds." : "Answer training/nutrition questions with citations from the knowledge base when relevant."}`;
}

export const DEFAULT_MODEL = process.env.GARANIMAL_AI_MODEL ?? "openai/gpt-5.4";

export function aiEnabled() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY);
}
