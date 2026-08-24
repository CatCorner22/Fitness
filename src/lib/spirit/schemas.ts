import { z } from "zod";

export const SpiritLiveAdviceSchema = z.object({
  message: z.string().describe("Spirit's short, kawaii but expert coaching line (2-4 sentences max)"),
  why: z.string().describe("One sentence evidence-based reason for the recommendation"),
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
  citeIds: z.array(z.string()).describe("Knowledge article ids used — must exist in KB"),
});

export type SpiritLiveAdvice = z.infer<typeof SpiritLiveAdviceSchema>;

export const SpiritChatSchema = z.object({
  message: z.string(),
  citeIds: z.array(z.string()),
  mood: z.enum(["proud", "encouraging", "caution", "celebrate", "thinking"]).optional(),
});

export type SpiritChatReply = z.infer<typeof SpiritChatSchema>;
