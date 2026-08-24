import Link from "next/link";
import { askCoachAction } from "@/app/actions/coach";
import { AppShell } from "@/components/app-shell";
import { SpiritMascot } from "@/components/spirit-mascot";
import { aiEnabled } from "@/lib/ai/spirit";
import { coachContext } from "@/lib/coach/engine";
import { historyForUser } from "@/lib/coach/engine";
import { bannedExercises } from "@/lib/exercises/registry";
import { searchKnowledge } from "@/lib/knowledge/search";
import { requireAuthed } from "@/lib/session-page";

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

  return (
    <AppShell user={user} profile={profile}>
      <div className="flex flex-wrap items-start gap-4">
        <SpiritMascot mood="encouraging" size={96} />
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-copper">Spirit · snow leopard spotter</p>
          <h1 className="display text-4xl">Coach</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Real LLM when <code className="text-xs">AI_GATEWAY_API_KEY</code> is set — otherwise evidence rules +
            knowledge base. Live mid-set coaching runs on every logged set during workouts.
            {profile.persona === "garanimal" ? " Garanimal intensity layered in." : ""}
          </p>
          <p className="mt-1 text-xs text-muted">
            Model: {process.env.GARANIMAL_AI_MODEL ?? "openai/gpt-5.4"} ·{" "}
            {aiEnabled() ? "connected" : "offline (rules fallback)"}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          *stretches paws* You&apos;re on {ctx.program?.name ?? "no program"}, week {profile.currentWeek}.{" "}
          {ctx.completed.length} sessions in 14 days. {ctx.deload.reason}
        </p>
        <Link href="/knowledge" className="mt-3 inline-block text-sm text-copper-2">
          Browse full knowledge base →
        </Link>
      </section>

      <div className="mt-6 space-y-3">
        {history.map((msg) => (
          <article
            key={msg.id}
            className={`rounded-2xl p-4 text-sm ${
              msg.role === "user" ? "ml-8 bg-surface-2" : "mr-8 border border-line bg-surface"
            }`}
          >
            <p className="text-xs uppercase text-muted">{msg.role === "user" ? "You" : "Spirit"}</p>
            <p className="mt-1 whitespace-pre-wrap">{msg.content}</p>
          </article>
        ))}
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
