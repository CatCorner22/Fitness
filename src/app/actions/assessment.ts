"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fitnessAssessments, profiles } from "@/lib/db/schema";
import { inputFromForm } from "@/lib/assessment/parse";
import { scoreAssessment } from "@/lib/assessment/score";
import { planAdjustFromAssessment } from "@/lib/assessment/plan-adjust";

function refresh() {
  revalidatePath("/");
  revalidatePath("/onboarding");
  revalidatePath("/onboarding/assess");
  revalidatePath("/onboarding/results");
  revalidatePath("/assess");
  revalidatePath("/settings");
}

export async function saveAssessmentAction(formData: FormData) {
  const user = await requireUser();
  const profile = getProfile(user.id);
  if (!profile) redirect("/onboarding");

  const input = inputFromForm(formData, profile);
  const result = scoreAssessment(input);
  result.planNotes = planAdjustFromAssessment(result).notes;

  const programId = profile.activeProgramId ?? "upper_lower";

  db.update(profiles)
    .set({
      assessmentJson: JSON.stringify(result),
      fitnessTier: result.overall,
      assessedAt: result.takenAt,
      experience: result.experience,
      onboarded: 1,
      activeProgramId: programId,
    })
    .where(eq(profiles.userId, user.id))
    .run();

  db.insert(fitnessAssessments)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      takenAt: result.takenAt,
      fitnessTier: result.overall,
      payload: JSON.stringify(result),
    })
    .run();

  refresh();
  redirect("/onboarding/results?toast=assess");
}
