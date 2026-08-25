import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SCORE_LABEL, TIER_LABEL } from "@/lib/assessment/types";
import { requireAuthed } from "@/lib/session-page";

export default async function OnboardingResultsPage() {
  const { user, profile } = await requireAuthed();
  const result = profile.assessment;

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Your baseline</h1>
      {!result ? (
        <p className="mt-3 text-muted">No check on file. You can take it under You.</p>
      ) : (
        <>
          <p className="mt-3 text-muted">{result.summary}</p>
          {result.overall ? (
            <p className="mt-4 display text-3xl text-copper-2">{TIER_LABEL[result.overall]}</p>
          ) : null}
          <ul className="mt-6 space-y-3">
            {result.domains.map((d) => (
              <li key={d.id} className="rounded-3xl border border-line bg-surface p-4">
                <p className="font-semibold">{d.name}</p>
                <p className="text-sm text-copper-2">
                  {d.skipped || d.score == null ? "Skipped" : SCORE_LABEL[d.score]}
                </p>
                <p className="mt-1 text-xs text-muted">{d.detail}</p>
              </li>
            ))}
          </ul>
          {result.planNotes.length ? (
            <section className="mt-6 rounded-3xl border border-line bg-surface p-5">
              <h2 className="font-semibold">What changes in your sessions</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {result.planNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
      <Link href="/" className="btn-primary mt-8">
        Show me today
      </Link>
    </AppShell>
  );
}
