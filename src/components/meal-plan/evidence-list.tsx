import type { Evidence } from "@/lib/nutrition/evidence";

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  const us = evidence.filter((e) => e.country === "US");
  const supporting = evidence.filter((e) => e.country !== "US");
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">Where the numbers come from</h2>
      <p className="mt-1 text-sm text-muted">
        Peer-reviewed US medical and sports-science sources first. Each entry says what this plan takes from
        it. Nothing here replaces a clinician if you are pregnant, under 18, on insulin or glucose-lowering
        medication, or have an eating-disorder history.
      </p>
      <ol className="mt-4 space-y-3 text-sm">
        {us.map((e, i) => (
          <li key={e.id} id={`ev-${e.id}`} className="rounded-2xl bg-bg-2 p-3">
            <p className="font-medium">
              {i + 1}. {e.short}
              <span className="ml-2 text-xs font-normal text-muted">{e.institution}</span>
            </p>
            <p className="mt-1 text-muted">{e.claim}</p>
            <p className="mt-1 text-xs text-muted">
              {e.citation}{" "}
              {e.url ? (
                <a href={e.url} target="_blank" rel="noreferrer" className="text-copper-2">
                  Source ↗
                </a>
              ) : null}
            </p>
          </li>
        ))}
      </ol>
      {supporting.length ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Supporting studies from outside the US</summary>
          <ol className="mt-2 space-y-3 text-sm">
            {supporting.map((e) => (
              <li key={e.id} className="rounded-2xl bg-bg-2 p-3">
                <p className="font-medium">
                  {e.short}
                  <span className="ml-2 text-xs font-normal text-muted">{e.institution}</span>
                </p>
                <p className="mt-1 text-muted">{e.claim}</p>
                <p className="mt-1 text-xs text-muted">
                  {e.citation}{" "}
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noreferrer" className="text-copper-2">
                      Source ↗
                    </a>
                  ) : null}
                </p>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
