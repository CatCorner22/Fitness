import { streamText } from "ai";
import { getProfile, getSession } from "@/lib/auth";
import { aiEnabled } from "@/lib/spirit/config";
import { buildTodayContextSummary, offlineBriefing } from "@/lib/spirit/context";
import { prepareSpiritBriefingStream } from "@/lib/spirit/chat-stream";

function textResponse(text: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}

export async function POST() {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const profile = getProfile(user.id);
  if (!profile) return new Response("Profile missing", { status: 400 });

  const todaySummary = buildTodayContextSummary(user.id, profile);

  if (!aiEnabled()) {
    return textResponse(offlineBriefing(user.id, profile));
  }

  const { system, prompt, model } = await prepareSpiritBriefingStream(profile, user.id, todaySummary);

  const result = streamText({
    model,
    system,
    prompt,
  });

  return result.toTextStreamResponse();
}
