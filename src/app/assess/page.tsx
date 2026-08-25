import { FitnessCheckForm } from "@/components/fitness-check-form";
import { AppShell } from "@/components/app-shell";
import { TIER_LABEL } from "@/lib/assessment/types";
import { requireAuthed } from "@/lib/session-page";

export default async function AssessPage() {
  const { user, profile } = await requireAuthed();

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Fitness check</h1>
      <p className="mt-2 text-muted">
        {profile.fitnessTier
          ? `Last band: ${TIER_LABEL[profile.fitnessTier]}. Retake anytime — sessions follow the newest score.`
          : "Six field tests. We scale your plan from this, not from ego."}
      </p>
      <div className="mt-8">
        <FitnessCheckForm submitLabel="Save and update sessions" skipLabel="Clear tests — back to defaults" />
      </div>
    </AppShell>
  );
}
