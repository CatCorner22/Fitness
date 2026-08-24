import { askCoachAction } from "@/app/actions/coach";
import { AppShell } from "@/components/app-shell";
import { generateCoachReply, historyForUser } from "@/lib/coach/engine";
import { bannedExercises } from "@/lib/exercises/registry";
import { requireAuthed } from "@/lib/session-page";

export default async function CoachPage() {
  const { user, profile } = await requireAuthed();
  const history = historyForUser(user.id);
  const briefing = generateCoachReply(user.id, profile);

  return (
    <AppShell user={user} profile={profile}>
      <p className="text-sm uppercase tracking-[0.18em] text-copper">
        {profile.persona === "garanimal" ? "Garanimal" : "Scientist"}
      </p>
      <h1 className="display text-4xl">Coach</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Rules first, personality second. This coach can only recommend exercises in the safety registry. It
        will never tell you to train through sharp pain or starve.
      </p>

      <section className="mt-6 whitespace-pre-wrap rounded-3xl border border-line bg-surface p-6 leading-relaxed">
        {briefing}
      </section>

      <div className="mt-6 space-y-3">
        {history.map((msg) => (
          <article
            key={msg.id}
            className={`rounded-2xl p-4 text-sm ${
              msg.role === "user" ? "ml-8 bg-surface-2" : "mr-8 border border-line bg-surface"
            }`}
          >
            <p className="text-xs uppercase text-muted">{msg.role === "user" ? "You" : "Coach"}</p>
            <p className="mt-1 whitespace-pre-wrap">{msg.content}</p>
          </article>
        ))}
      </div>

      <form action={askCoachAction} className="mt-6 flex gap-2">
        <input name="question" placeholder="Ask about swaps, volume, pole prep, protein..." />
        <button className="rounded-2xl bg-copper px-4 text-sm font-semibold text-bg" type="submit">
          Send
        </button>
      </form>

      <section className="mt-10">
        <h2 className="display text-2xl">Why some gym favorites are banned</h2>
        <div className="mt-4 space-y-3">
          {bannedExercises().map((ex) => (
            <article key={ex.id} className="rounded-2xl border border-line bg-surface p-4">
              <h3 className="text-lg">{ex.name}</h3>
              <p className="mt-1 text-sm text-muted">{ex.safetyNote}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}