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

  // Requiring a JSON content type forces cross-origin senders into a CORS
  // preflight, which fails; the Replit session cookie is SameSite=None.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return new Response("Invalid request", { status: 415 });
  }
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

  const storeUserQuestion = () => {
    const lastStored = db
      .select()
      .from(coachMessages)
      .where(eq(coachMessages.userId, user.id))
      .orderBy(desc(coachMessages.createdAt))
      .get();
    if (!lastStored || lastStored.role !== "user" || lastStored.content !== question) {
      storeCoachMessage(user.id, "user", question);
    }
  };

  const optIn = await getAiOptIn();
  if (!optIn || !aiEnabled()) {
    storeUserQuestion();
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

  // Prepare before storing the question so the prompt's history block does not
  // duplicate the question that is already in `messages`.
  const { system, citeIds } = await prepareSpiritChatStream(profile, user.id, question);
  storeUserQuestion();

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

  return result.toUIMessageStreamResponse({
    // Lets the chat UI render knowledge-base citation links on the live reply,
    // matching the citeIds persisted with the stored copy.
    messageMetadata: ({ part }) => (part.type === "finish" ? { citeIds } : undefined),
  });
}
