"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateChatReply } from "@/lib/ai/live-advice";
import { getProfile, getSession } from "@/lib/auth";
import { coachContext } from "@/lib/coach/engine";
import { db } from "@/lib/db";
import { coachMessages } from "@/lib/db/schema";

function contextSummary(userId: string, profile: NonNullable<ReturnType<typeof getProfile>>) {
  const ctx = coachContext(userId, profile);
  return `Program: ${ctx.program?.name ?? "none"}, week ${profile.currentWeek}, ${profile.sessionMinutes} min sessions.
Last 14 days: ${ctx.completed.length} completed, ${ctx.missed.length} skipped.
Deload: ${ctx.deload.deload ? "yes — " + ctx.deload.reason : ctx.deload.reason}
Goal: ${profile.goal}. Injuries: ${profile.injuries.join(", ") || "none"}.`;
}

export async function askCoachAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const profile = getProfile(user.id);
  if (!profile) redirect("/onboarding");

  const question = String(formData.get("question") || "").trim();
  const now = new Date().toISOString();
  if (question) {
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

  const { text } = await generateChatReply({
    profile,
    question: question || "Give me a briefing for today's training.",
    contextSummary: contextSummary(user.id, profile),
  });

  db.insert(coachMessages)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      role: "coach",
      content: text,
      createdAt: new Date().toISOString(),
    })
    .run();
  revalidatePath("/coach");
}
