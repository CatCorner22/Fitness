import type { ProfileRow } from "@/lib/auth";
import { runSpiritChatReply, runSpiritLiveAdvice, type LiveAdviceRequest } from "@/lib/spirit/service";

export type { LiveAdviceRequest };

export async function generateLiveAdvice(req: LiveAdviceRequest) {
  return runSpiritLiveAdvice(req);
}

export async function generateChatReply(options: {
  profile: ProfileRow;
  question: string;
  contextSummary: string;
  history?: { role: "user" | "coach"; content: string }[];
}) {
  return runSpiritChatReply(options);
}

export async function generateBriefing(options: { profile: ProfileRow; contextSummary: string }) {
  const { runSpiritBriefing } = await import("@/lib/spirit/service");
  return runSpiritBriefing(options);
}
