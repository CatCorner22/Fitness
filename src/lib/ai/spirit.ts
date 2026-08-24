import { z } from "zod";
import { spiritSystemPrompt as buildSpiritSystemPrompt, SPIRIT_PROMPT_VERSION } from "@/lib/spirit/prompts";

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

export { aiEnabled, getSpiritConfig } from "@/lib/spirit/config";
export { modelLabel } from "@/lib/spirit/provider";
export { SPIRIT_PROMPT_VERSION };

export const DEFAULT_MODEL = process.env.GARANIMAL_AI_MODEL ?? "openai/gpt-5.4";

export function spiritSystemPrompt(options: {
  persona: "scientist" | "garanimal";
  knowledgeBlock: string;
  registryBlock: string;
  live?: boolean;
}) {
  return buildSpiritSystemPrompt({ ...options, parseContext: undefined, strictAddendum: undefined });
}
