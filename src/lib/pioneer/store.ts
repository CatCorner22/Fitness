import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pioneerDrafts } from "@/lib/db/schema";
import type { PioneerDraftRecord, PioneerKind } from "./types";

const KINDS = new Set<PioneerKind>(["training", "nutrition", "mixed"]);

export function draftIdFor(userId: string) {
  return `pioneer-${userId}`;
}

export function getPioneerDraft(userId: string): PioneerDraftRecord | null {
  const row = db.select().from(pioneerDrafts).where(eq(pioneerDrafts.userId, userId)).get();
  if (!row) return null;
  const kind = KINDS.has(row.kind as PioneerKind) ? (row.kind as PioneerKind) : "mixed";
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    kind,
    updatedAt: row.updatedAt,
  };
}

export function upsertPioneerDraft(
  userId: string,
  input: { title: string; body: string; kind: PioneerKind },
): PioneerDraftRecord {
  const now = new Date().toISOString();
  const id = draftIdFor(userId);
  const title = input.title.trim().slice(0, 120);
  const body = input.body.slice(0, 20000);
  const kind = KINDS.has(input.kind) ? input.kind : "mixed";
  const existing = getPioneerDraft(userId);
  if (existing) {
    db.update(pioneerDrafts)
      .set({ title, body, kind, updatedAt: now })
      .where(eq(pioneerDrafts.userId, userId))
      .run();
  } else {
    db.insert(pioneerDrafts)
      .values({ id, userId, title, body, kind, updatedAt: now })
      .run();
  }
  return { id, title, body, kind, updatedAt: now };
}
