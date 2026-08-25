export function parseCoachMeta(content: string): { text: string; citeIds: string[] } {
  const match = content.match(/\n\n<!-- spirit-meta: ([\s\S]*) -->$/);
  if (!match) return { text: content, citeIds: [] };
  try {
    const meta = JSON.parse(match[1]!) as { citeIds?: string[] };
    return { text: content.replace(/\n\n<!-- spirit-meta:[\s\S]* -->$/, ""), citeIds: meta.citeIds ?? [] };
  } catch {
    return { text: content, citeIds: [] };
  }
}

export function coachMetaSuffix(citeIds: string[]) {
  return citeIds.length ? `\n\n<!-- spirit-meta: ${JSON.stringify({ citeIds })} -->` : "";
}

export function textFromUIMessageParts(parts: { type: string; text?: string }[] | undefined) {
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p) => p && p.type === "text" && typeof p.text === "string")
    .map((p) => p.text!)
    .join("");
}
