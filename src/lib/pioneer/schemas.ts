import { z } from "zod";

export const PioneerReadObservationSchema = z.object({
  id: z.string().max(64).describe("Stable claim id such as missing-rpe or peak-plus-fast"),
  what: z.string().max(220).describe("Short objective observation. Never a rewrite of the draft."),
  why: z.string().max(280).describe("One evidence-based reason"),
  question: z.string().max(180).nullable().describe("Optional question for the human. Not an instruction to edit."),
  source: z.string().max(80).describe("Allow-listed authority label only"),
  quote: z.string().max(200).nullable().describe("Exact draft substring when talking about existing wording"),
  about: z.enum(["existing", "gap", "alignment"]),
  rewrite: z
    .string()
    .max(400)
    .nullable()
    .describe("Internal only. Must preserve meaning. Will be stripped before the human sees anything."),
});

export const PioneerReadSchema = z.object({
  observations: z.array(PioneerReadObservationSchema).max(4),
});

export type PioneerRead = z.infer<typeof PioneerReadSchema>;
