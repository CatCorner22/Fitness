import Link from "next/link";
import { askCoachAction } from "@/app/actions/coach";
import { AppShell } from "@/components/app-shell";
import { SpiritMascot } from "@/components/spirit-mascot";
import { aiEnabled, modelLabel } from "@/lib/ai/spirit";
import { generateBriefing } from "@/lib/ai/live-advice";
import { coachContext } from "@/lib/coach/engine";
import { historyForUser } from "@/lib/coach/engine";
import { bannedExercises } from "@/lib/exercises/registry";
import { searchKnowledge } from "@/lib/knowledge/search";
import { requireAuthed } from "@/lib/session-page";

function parseCoachMeta(content: string): { text: string; citeIds: string[] } {
  const match = content.match(/\n\n<!-- spirit-meta: ([\s\S]*) -->$/);
  if (!match) return { text: content, citeIds: [] };
  try {
    const meta = JSON.parse(match[1]!) as { citeIds?: string[] };
    return { text: content.replace(/\n\n<!-- spirit-meta:[\s\S]* -->$/, ""), citeIds: meta.citeIds ?? [] };
  } catch {
    return { text: content, citeIds: [] };
  }
}

export default async function CoachPage() {
  const { user, profile } = await requireAuthed();
  const history = historyForUser(user.id);
  const ctx = coachContext(user.id, profile);
  const featured = searchKnowledge({
    goal: profile.goal,
    programId: profile.activeProgramId ?? undefined,
    injuries: profile.injuries,
    limit: 3,
  });

  const contextSummary = `Program: ${ctx.program?.name ?? "none"}, week ${profile.currentWeek}, ${profile.sessionMinutes} min sessions.
Last 14 days: ${ctx.completed.length} completed, ${ctx.missed.length} skipped.
Deload: ${ctx.deload.deload ? "yes — " + ctx.deload.reason : ctx.deload.reason}
Goal: ${profile.goal}. Injuries: ${profile.injuries.join(", ") || "none"}.
Today's fatigue check-in: ${ctx.checkin?.fatigue ?? "not logged"}/5.`;

  const briefing = aiEnabled()
    ? await generateBriefing({ profile, contextSummary })
    : null;

  return (
    <AppShell user={user} profile={profile}>
      <div className="flex flex-wrap items-start gap-4">
        <SpiritMascot mood={briefing?.mood ?? "encouraging"} size={96} />
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-copper">Spirit · snow leopard spotter</p>
          <h1 className="display text-4xl">Coach</h1>
          <p className="mt-2 max-w-2xl text-muted">
            SuperByte-inspired pipeline: deterministic gauges + risk routing + LLM with citation cage. Live coaching
            on every logged set.
            {profile.persona === "garanimal" ? " Garanimal intensity layered in." : ""}
          </p>
          <p className="mt-1 text-xs text-muted">
            {modelLabel()} · {aiEnabled() ? "LLM connected" : "offline (rules + KB)"}
            {process.env.HF_TOKEN || process.env.HUGGINGFACE_HUB_TOKEN ? " · HF semantic search" : ""}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-line bg-surface p-6 mt-6">
        <p className="text-xs uppercase tracking-wider text-copper">Daily briefing</p>
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
          {briefing?.text ??
            `*stretches paws* You're on ${ctx.program?.name ?? "no program"}, week ${profile.currentWeek}. ${ctx.completed.length} sessions in 14 days. ${ctx.deload.reason}`}
        </p>
        {briefing?.citeIds?.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {briefing.citeIds.map((id) => (
              <Link key={id} href={`/knowledge#${id}`} className="rounded-full bg-bg px-2 py-0.5 text-[10px] text-copper-2">
                {id}
              </Link>
            ))}
          </div>
        ) : null}
        <Link href="/knowledge" className="mt-3 inline-block text-sm text-copper-2">
          Browse full knowledge base →
        </Link>
      </section>

      <div className="mt-6 space-y-3">
        {history.map((msg) => {
          const parsed = msg.role === "coach" ? parseCoachMeta(msg.content) : { text: msg.content, citeIds: [] };
          return (
            <article
              key={msg.id}
              className={`rounded-2xl p-4 text-sm ${
                msg.role === "user" ? "ml-8 bg-surface-2" : "mr-8 border border-line bg-surface"
              }`}
            >
              <p className="text-xs uppercase text-muted">{msg.role === "user" ? "You" : "Spirit"}</p>
              <p className="mt-1 whitespace-pre-wrap">{parsed.text}</p>
              {parsed.citeIds.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {parsed.citeIds.map((id) => (
                    <Link key={id} href={`/knowledge#${id}`} className="text-[10px] text-copper-2">
                      {id}
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <form action={askCoachAction} className="mt-6 flex gap-2">
        <input name="question" placeholder="Ask about swaps, volume, pole prep, protein, rest..." />
        <button className="rounded-2xl bg-copper px-4 text-sm font-semibold text-bg" type="submit">
          Ask Spirit
        </button>
      </form>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="display text-2xl">Featured for you</h2>
          <ul className="mt-3 space-y-3">
            {featured.map((a) => (
              <li key={a.id} className="rounded-2xl border border-line bg-surface p-4 text-sm">
                <Link href={`/knowledge#${a.id}`} className="font-medium text-copper-2">
                  {a.title}
                </Link>
                <p className="mt-1 text-muted">{a.summary}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="display text-2xl">Banned lifts</h2>
          <div className="mt-3 space-y-3">
            {bannedExercises().map((ex) => (
              <article key={ex.id} className="rounded-2xl border border-line bg-surface p-4">
                <h3 className="text-lg">{ex.name}</h3>
                <p className="mt-1 text-sm text-muted">{ex.safetyNote}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
