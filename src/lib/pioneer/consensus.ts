import type { PioneerObservation, PioneerProfile } from "./types";

function consensusKey(row: PioneerObservation): string {
  return row.id.trim().toLowerCase() || row.what.trim().toLowerCase().slice(0, 80);
}

export function mergeConsensus(
  reads: PioneerObservation[][],
  profile: PioneerProfile,
): { observations: PioneerObservation[]; corroboration?: { seen: number; reads: number } } {
  const n = reads.length;
  if (n === 0) return { observations: [] };
  if (n === 1) return { observations: reads[0] ?? [] };

  const needed = profile.unanimous ? n : Math.floor(n / 2) + 1;
  const byKey = new Map<string, { row: PioneerObservation; seen: number }>();

  for (const read of reads) {
    const seenHere = new Set<string>();
    for (const row of read) {
      const key = consensusKey(row);
      if (seenHere.has(key)) continue;
      seenHere.add(key);
      const existing = byKey.get(key);
      if (existing) existing.seen += 1;
      else byKey.set(key, { row, seen: 1 });
    }
  }

  const kept: PioneerObservation[] = [];
  let bestSeen = 0;
  for (const entry of byKey.values()) {
    if (entry.seen < needed) continue;
    kept.push(entry.row);
    if (entry.seen > bestSeen) bestSeen = entry.seen;
  }

  return {
    observations: kept.slice(0, 4),
    corroboration: { seen: bestSeen, reads: n },
  };
}

export function mergeLayers(
  instrument: PioneerObservation[],
  pioneer: PioneerObservation[],
  limit = 5,
): PioneerObservation[] {
  const out: PioneerObservation[] = [];
  const ids = new Set<string>();
  for (const row of [...instrument, ...pioneer]) {
    if (ids.has(row.id)) continue;
    ids.add(row.id);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}
