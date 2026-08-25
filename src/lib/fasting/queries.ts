import { and, desc, eq } from "drizzle-orm";
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

export function adjustmentsForFast(fastId: string, userId: string) {
  return db
    .select()
    .from(fastAdjustments)
    .where(and(eq(fastAdjustments.fastId, fastId), eq(fastAdjustments.userId, userId)))
    .orderBy(desc(fastAdjustments.createdAt))
    .all();
}

export function fastOwnedBy(fastId: string, userId: string) {
  return db
    .select()
    .from(fasts)
    .where(and(eq(fasts.id, fastId), eq(fasts.userId, userId)))
    .get();
}
