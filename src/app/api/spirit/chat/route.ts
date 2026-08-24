import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, streamText, type UIMessage } from "ai";
import { eq, desc } from "drizzle-orm";
import { getProfile, getSession } from "@/lib/auth";
import { generateChatReply } from "@/lib/ai/live-advice";
import { db } from "@/lib/db";
import { coachMessages } from "@/lib/db/schema";
import { aiEnabled } from "@/lib/spirit/config";
import { coachMetaSuffix, buildCoachContextSummary, textFromUIMessageParts } from "@/lib/spirit/context";
import { prepareSpiritChatStream } from "@/lib/spirit/chat-stream";
import { modelForTier } from "@/lib/spirit/provider";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const profile = getProfile(user.id);
  if (!profile) return new Response("Profile missing", { status: 400 });

  const body = await request.json();
  const messages: UIMessage[] = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const question = lastUser ? textFromUIMessageParts(lastUser.parts) : "";

  if (!question.trim()) {
    return new Response("Question required", { status: 400 });
  }

  const now = new Date().toISOString();
  const lastStored = db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.userId, user.id))
    .orderBy(desc(coachMessages.createdAt))
    .get();

  if (!lastStored || lastStored.role !== "user" || lastStored.content !== question) {
    db.insert(coachMessages)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        role: "user",
        content: question,
        createdAt: now,
      })
      .run();
  }

  if (!aiEnabled()) {
    const { text, citeIds } = await generateChatReply({
      profile,
      question,
      contextSummary: buildCoachContextSummary(user.id, profile),
    });
    db.insert(coachMessages)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        role: "coach",
        content: text + coachMetaSuffix(citeIds),
        createdAt: new Date().toISOString(),
      })
      .run();

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

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: modelForTier("chat"),
    system,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      db.insert(coachMessages)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          role: "coach",
          content: text + coachMetaSuffix(citeIds),
          createdAt: new Date().toISOString(),
        })
        .run();
    },
  });

  return result.toUIMessageStreamResponse();
}
