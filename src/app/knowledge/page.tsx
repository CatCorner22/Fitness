import { AppShell } from "@/components/app-shell";
import { KNOWLEDGE_ARTICLES } from "@/lib/knowledge/articles";
import { searchKnowledge } from "@/lib/knowledge/search";
import { requireAuthed } from "@/lib/session-page";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user, profile } = await requireAuthed();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const results = q
    ? searchKnowledge({
        query: q,
        goal: profile.goal,
        programId: profile.activeProgramId ?? undefined,
        injuries: profile.injuries,
        limit: 20,
      })
    : KNOWLEDGE_ARTICLES;

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Guide</h1>
      <p className="mt-2 max-w-2xl text-muted">Short notes on lifting and food. Search if you want.</p>
      <form className="mt-6 flex gap-2" action="/knowledge" method="get">
        <input name="q" defaultValue={q} placeholder="Search: glutes, rest, RPE, pole, protein..." />
        <button className="rounded-2xl bg-copper px-4 text-sm text-bg" type="submit">
          Search
        </button>
      </form>
      <div className="mt-8 space-y-4">
        {results.map((a) => (
          <article key={a.id} id={a.id} className="scroll-mt-24 rounded-3xl border border-line bg-surface p-6">
            <p className="text-xs uppercase tracking-wider text-copper">{a.tags.join(" · ")}</p>
            <h2 className="display mt-1 text-2xl">{a.title}</h2>
            <p className="mt-2 font-medium text-ink">{a.summary}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{a.body}</p>
            {a.citations?.length ? (
              <p className="mt-3 text-xs text-muted">Sources: {a.citations.join("; ")}</p>
            ) : null}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
