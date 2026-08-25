import { FitnessCheckForm } from "@/components/fitness-check-form";
import { requireAuthed } from "@/lib/session-page";

export default async function OnboardingAssessPage() {
  const { user } = await requireAuthed({ allowOnboarding: true });

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <p className="text-xs uppercase tracking-[0.16em] text-copper">Step 2</p>
      <h1 className="display text-4xl">Fitness check</h1>
      <p className="mt-3 text-muted">
        Six field tests, {user.displayName}. About 15 minutes. Skip any item. We use the scores to scale RPE, swaps,
        and extras — not to assign a moral grade.
      </p>
      <div className="mt-8">
        <FitnessCheckForm submitLabel="Score my sessions" skipLabel="Skip tests — use the default start" />
      </div>
    </div>
  );
}
