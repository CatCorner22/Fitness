import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fastAdjustments, fasts } from "@/lib/db/schema";

export function runningFast(userId: string) {
  return db
    .select()
    .from(fasts)
    .where(eq(fasts.userId, userId))
    .all()
    .find((f) => f.status === "running");
}

export function recentFasts(userId: string, limit = 8) {
  return db
    .select()
    .from(fasts)
    .where(eq(fasts.userId, userId))
    .orderBy(desc(fasts.startedAt))
    .limit(limit)
    .all();
}

export function adjustmentsForFast(fastId: string) {
  return db
    .select()
    .from(fastAdjustments)
    .where(eq(fastAdjustments.fastId, fastId))
    .orderBy(desc(fastAdjustments.createdAt))
    .all();
}

export function fastOwnedBy(fastId: string, userId: string) {
  const row = db.select().from(fasts).where(eq(fasts.id, fastId)).get();
  if (!row || row.userId !== userId) return null;
  return row;
}
