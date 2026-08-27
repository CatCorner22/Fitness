import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, streamText, type UIMessage } from "ai";
import { eq, desc } from "drizzle-orm";
import { getProfile, getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { coachMessages } from "@/lib/db/schema";
import { generateCoachReply, storeCoachMessage } from "@/lib/coach/engine";
import { aiEnabled } from "@/lib/spirit/config";
import { coachMetaSuffix, textFromUIMessageParts } from "@/lib/spirit/client-utils";
import { getAiOptIn } from "@/lib/prefs";
import { prepareSpiritChatStream } from "@/lib/spirit/chat-stream";
import { modelForTier } from "@/lib/spirit/provider";

const MAX_QUESTION = 4000;
const MAX_MESSAGES = 40;

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const profile = getProfile(user.id);
  if (!profile) return new Response("Profile missing", { status: 400 });

  let body: { messages?: UIMessage[] };
  try {
    body = (await request.json()) as { messages?: UIMessage[] };
  } catch {
    return new Response("Invalid request", { status: 400 });
  }
  const messages: UIMessage[] = Array.isArray(body.messages)
    ? body.messages.slice(-MAX_MESSAGES)
    : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const parts = lastUser && Array.isArray(lastUser.parts) ? lastUser.parts : [];
  const question = lastUser ? textFromUIMessageParts(parts).slice(0, MAX_QUESTION) : "";

  if (!question.trim()) {
    return new Response("Question required", { status: 400 });
  }

  const lastStored = db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.userId, user.id))
    .orderBy(desc(coachMessages.createdAt))
    .get();

  if (!lastStored || lastStored.role !== "user" || lastStored.content !== question) {
    storeCoachMessage(user.id, "user", question);
  }

  const optIn = await getAiOptIn();
  if (!optIn || !aiEnabled()) {
    const text = generateCoachReply(user.id, profile, question);
    storeCoachMessage(user.id, "coach", text);

    const msgId = crypto.randomUUID();
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "start", messageId: msgId });
        writer.write({ type: "text-start", id: "t1" });
        writer.write({ type: "text-delta", id: "t1", delta: text });
        writer.write({ type: "text-end", id: "t1" });
        writer.write({ type: "finish" });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const { system, citeIds } = await prepareSpiritChatStream(profile, user.id, question);

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch {
    return new Response("Invalid messages", { status: 400 });
  }

  const result = streamText({
    model: modelForTier("chat"),
    system,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      try {
        storeCoachMessage(user.id, "coach", text + coachMetaSuffix(citeIds));
      } catch (error) {
        console.error("Failed to store Spirit reply", error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
