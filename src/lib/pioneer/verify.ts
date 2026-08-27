import { getArticle } from "../knowledge/articles";
import { observationLooksLikeEdit } from "./escape";
import { normalizeSource } from "./sources";
import type { PioneerAbout, PioneerObservation } from "./types";

export type RawPioneerObservation = {
  id: string;
  what: string;
  why: string;
  question?: string | null;
  source: string;
  quote?: string | null;
  about: PioneerAbout;
  rewrite?: string | null;
};

function normalize(s: string) {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

export function quoteInDraft(quote: string, draft: string): boolean {
  const q = normalize(quote);
  if (q.length < 6) return false;
  return normalize(draft).includes(q);
}

export function stripCopyable<T extends { rewrite?: string | null }>(row: T): Omit<T, "rewrite"> {
  const rest = { ...row };
  delete rest.rewrite;
  return rest;
}

export function verifyObservation(
  raw: RawPioneerObservation,
  draft: string,
): PioneerObservation | null {
  if (observationLooksLikeEdit(raw.what, raw.why, raw.rewrite).hit) return null;

  const source = normalizeSource(raw.source, (id) => Boolean(getArticle(id)));
  if (!source) return null;

  const what = raw.what.trim();
  const why = raw.why.trim();
  if (what.length < 8 || why.length < 8) return null;
  if (what.length > 240 || why.length > 320) return null;

  if (raw.about === "existing") {
    const quote = raw.quote?.trim() ?? "";
    if (!quote || !quoteInDraft(quote, draft)) return null;
  } else if (raw.quote && raw.quote.trim() && !quoteInDraft(raw.quote, draft)) {
    return null;
  }

  const question = raw.question?.trim();
  const quote = raw.quote?.trim();

  return {
    id: raw.id.trim().slice(0, 64) || "obs",
    layer: "pioneer",
    what,
    why,
    question: question ? question.slice(0, 180) : undefined,
    source,
    quote: quote || undefined,
    about: raw.about,
  };
}
