"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";
import { generateCoachReply } from "@/lib/coach/engine";
import { db } from "@/lib/db";
import { coachMessages } from "@/lib/db/schema";

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
  const reply = generateCoachReply(user.id, profile, question || undefined);
  db.insert(coachMessages)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      role: "coach",
      content: reply,
      createdAt: new Date().toISOString(),
    })
    .run();
  revalidatePath("/coach");
}