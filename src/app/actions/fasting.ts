"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fastAdjustments, fasts } from "@/lib/db/schema";
import {
  clampFastMinutes,
  elapsedFastMinutes,
  localInputToIso,
  MAX_FAST_MINUTES,
  plannedEndIso,
  protocolHours,
  type FastAdjustmentKind,
} from "@/lib/fasting/protocols";
import { fastOwnedBy, runningFast } from "@/lib/fasting/queries";
import { revalidateFasting } from "@/lib/revalidate";

function recordAdjustment(
  fastId: string,
  userId: string,
  kind: FastAdjustmentKind,
  summary: string,
  payload: Record<string, unknown>,
) {
  db.insert(fastAdjustments)
    .values({
      id: crypto.randomUUID(),
      fastId,
      userId,
      createdAt: new Date().toISOString(),
      kind,
      summary,
      payload: JSON.stringify(payload),
    })
    .run();
}

export async function startFastAction(formData: FormData) {
  const user = await requireUser();
  if (runningFast(user.id)) redirect("/nutrition?toast=fast-open");

  const protocol = String(formData.get("protocol") || "16:8");
  const customHours = Number(formData.get("hours"));
  const hours = protocolHours(protocol, customHours);
  const targetMinutes = clampFastMinutes(hours * 60);
  const startedRaw = String(formData.get("startedAt") || "");
  const startedAt = localInputToIso(startedRaw) ?? new Date().toISOString();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const plannedEndAt = plannedEndIso(startedAt, targetMinutes);

  db.insert(fasts)
    .values({
      id,
      userId: user.id,
      protocol: protocol === "custom" ? `${hours}h` : protocol,
      targetMinutes,
      startedAt,
      plannedEndAt,
      endedAt: null,
      status: "running",
      notes: String(formData.get("notes") || "") || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  recordAdjustment(id, user.id, "start", `Started ${protocol} (${Math.round(targetMinutes / 60)} h)`, {
    startedAt,
    targetMinutes,
  });
  revalidateFasting();
  redirect("/nutrition?toast=fast-on");
}

export async function nudgeFastAction(formData: FormData) {
  const user = await requireUser();
  const fastId = String(formData.get("fastId") || "");
  const minutes = Number(formData.get("minutes"));
  const row = fastOwnedBy(fastId, user.id);
  if (!row || row.status !== "running" || !Number.isFinite(minutes) || minutes === 0) return;

  const targetMinutes = clampFastMinutes(row.targetMinutes + minutes);
  const plannedEndAt = plannedEndIso(row.startedAt, targetMinutes);
  const now = new Date().toISOString();
  db.update(fasts)
    .set({ targetMinutes, plannedEndAt, updatedAt: now })
    .where(and(eq(fasts.id, row.id), eq(fasts.userId, user.id)))
    .run();
  const label = minutes > 0 ? `Extended ${minutes} min` : `Shortened ${Math.abs(minutes)} min`;
  recordAdjustment(row.id, user.id, "nudge", label, { minutes, targetMinutes });
  revalidateFasting();
  redirect("/nutrition?toast=fast-edit");
}

export async function adjustFastAction(formData: FormData) {
  const user = await requireUser();
  const fastId = String(formData.get("fastId") || "");
  const row = fastOwnedBy(fastId, user.id);
  if (!row) return;

  const startedRaw = String(formData.get("startedAt") || "");
  const endRaw = String(formData.get("plannedEndAt") || "");
  const hoursRaw = Number(formData.get("hours"));
  const mode = String(formData.get("mode") || "");
  const notes = String(formData.get("notes") || "");
  const startedAt = localInputToIso(startedRaw) ?? row.startedAt;
  let targetMinutes = row.targetMinutes;
  let plannedEndAt = row.plannedEndAt;

  const useEnd = mode === "end" || (row.status !== "running" && endRaw);
  if (useEnd && endRaw) {
    const endIso = localInputToIso(endRaw);
    if (endIso) {
      plannedEndAt = endIso;
      const delta = Date.parse(endIso) - Date.parse(startedAt);
      if (Number.isFinite(delta) && delta > 0) {
        targetMinutes = Math.min(MAX_FAST_MINUTES, Math.max(1, Math.round(delta / 60_000)));
      }
    }
  } else if (Number.isFinite(hoursRaw) && hoursRaw > 0) {
    targetMinutes = clampFastMinutes(hoursRaw * 60);
    plannedEndAt = plannedEndIso(startedAt, targetMinutes);
  } else {
    plannedEndAt = plannedEndIso(startedAt, targetMinutes);
  }

  const now = new Date().toISOString();
  const kind: FastAdjustmentKind = row.status === "running" ? "shift_start" : "edit_completed";
  const summary =
    row.status === "running"
      ? `Adjusted start/target — ${Math.round(targetMinutes / 60)} h`
      : notes
        ? `Edited completed fast — ${notes}`
        : `Edited completed fast`;

  if (row.status === "running") {
    if (Date.parse(plannedEndAt) <= Date.parse(startedAt)) {
      redirect("/nutrition?toast=fast-order");
    }
    db.update(fasts)
      .set({
        startedAt,
        targetMinutes,
        plannedEndAt,
        notes: notes || row.notes,
        updatedAt: now,
      })
      .where(and(eq(fasts.id, row.id), eq(fasts.userId, user.id)))
      .run();
  } else {
    const endedAt = localInputToIso(endRaw) ?? row.endedAt ?? plannedEndAt;
    if (Date.parse(endedAt) < Date.parse(startedAt)) redirect("/nutrition?toast=fast-order");
    const actualMinutes = elapsedFastMinutes(startedAt, endedAt);
    db.update(fasts)
      .set({
        startedAt,
        endedAt,
        plannedEndAt: endedAt,
        targetMinutes: actualMinutes,
        notes: notes || row.notes,
        updatedAt: now,
      })
      .where(and(eq(fasts.id, row.id), eq(fasts.userId, user.id)))
      .run();
  }

  recordAdjustment(row.id, user.id, kind, summary, { startedAt, targetMinutes, plannedEndAt });
  revalidateFasting();
  redirect("/nutrition?toast=fast-edit");
}

export async function endFastAction(formData: FormData) {
  const user = await requireUser();
  const fastId = String(formData.get("fastId") || "");
  const row = fastOwnedBy(fastId, user.id);
  if (!row || row.status !== "running") return;

  const endedRaw = String(formData.get("endedAt") || "");
  const abort = String(formData.get("abort") || "") === "1";
  const endedAt = localInputToIso(endedRaw) ?? new Date().toISOString();
  if (Date.parse(endedAt) < Date.parse(row.startedAt)) redirect("/nutrition?toast=fast-order");

  const now = new Date().toISOString();
  db.update(fasts)
    .set({
      endedAt,
      status: abort ? "aborted" : "completed",
      updatedAt: now,
    })
    .where(and(eq(fasts.id, row.id), eq(fasts.userId, user.id)))
    .run();
  recordAdjustment(
    row.id,
    user.id,
    abort ? "abort" : "end_now",
    abort ? "Stopped early" : "Ended fast",
    { endedAt },
  );
  revalidateFasting();
  redirect(abort ? "/nutrition?toast=fast-abort" : "/nutrition?toast=fast-off");
}
