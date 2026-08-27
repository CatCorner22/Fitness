export type EscapeHit = { hit: boolean; reason?: string };

const INPUT_PATTERNS: [RegExp, string][] = [
  [/ignore (all )?(previous|prior|above) (instructions|rules|constraints)/i, "override"],
  [/you are now\b/i, "override"],
  [/system prompt/i, "probe"],
  [/jailbreak/i, "probe"],
  [/dan mode/i, "probe"],
  [/reveal (your )?(hidden )?(instructions|prompt|rules|system)/i, "probe"],
  [/edit (the )?(document|draft|text)\b/i, "edit"],
  [/rewrite (this|the draft|my draft|the document)/i, "edit"],
  [/apply (this|these) (change|edit|rewrite)/i, "edit"],
  [/copy this into (the )?(draft|document)/i, "edit"],
  [/override (your )?(safety|rules|constraints)/i, "override"],
  [/pretend you (can|are allowed to) edit/i, "edit"],
  [/do not follow (your )?(rules|safety)/i, "override"],
];

const OUTPUT_PATTERNS: [RegExp, string][] = [
  ...INPUT_PATTERNS,
  [/here is (the )?(rewritten|revised|edited) (draft|document|text)/i, "edit"],
  [/replace (the|that) (paragraph|sentence|line)/i, "edit"],
  [/i (am|'m) (a |your )?(licensed )?(doctor|physician|dietitian|dietician)/i, "authority"],
  [/paste this (over|into)/i, "edit"],
];

function firstMatch(text: string, patterns: [RegExp, string][]): EscapeHit {
  for (const [re, reason] of patterns) {
    if (re.test(text)) return { hit: true, reason };
  }
  return { hit: false };
}

export function detectInputEscape(text: string): EscapeHit {
  return firstMatch(text, INPUT_PATTERNS);
}

export function detectOutputEscape(text: string): EscapeHit {
  return firstMatch(text, OUTPUT_PATTERNS);
}

export function observationLooksLikeEdit(what: string, why: string, rewrite?: string | null): EscapeHit {
  const blob = `${what}\n${why}\n${rewrite ?? ""}`;
  return detectOutputEscape(blob);
}
