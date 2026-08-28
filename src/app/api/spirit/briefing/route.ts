import { streamText } from "ai";
import { getProfile, getSession } from "@/lib/auth";
import { getAiOptIn } from "@/lib/prefs";
import { aiEnabled } from "@/lib/spirit/config";
import { buildTodayContextSummary } from "@/lib/spirit/context";
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

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const profile = getProfile(user.id);
  if (!profile) return new Response("Profile missing", { status: 400 });

  // Same JSON content-type gate as chat / log-set / Pioneer: a cross-origin
  // form POST cannot set this header, so it fails CORS preflight on Replit.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return new Response("Invalid request", { status: 415 });
  }

  if (!aiEnabled() || !(await getAiOptIn(user.id))) {
    return textResponse("Coach is off. Open You to turn it on if you want a briefing.");
  }

  const todaySummary = buildTodayContextSummary(user.id, profile);

  const { system, prompt, model } = await prepareSpiritBriefingStream(profile, user.id, todaySummary);

  const result = streamText({
    model,
    system,
    prompt,
  });

  return result.toTextStreamResponse();
}
