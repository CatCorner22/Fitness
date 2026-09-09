"use server";

import { redirect } from "next/navigation";
import { getProfile, requireUser } from "@/lib/auth";
import { buildPioneerHousehold, serializePlateDraft } from "@/lib/pioneer/context";
import { upsertPioneerDraft } from "@/lib/pioneer/store";
import type { PioneerKind } from "@/lib/pioneer/types";
import { todayNutrition } from "@/lib/today";

const KINDS = new Set<PioneerKind>(["training", "nutrition", "mixed"]);

export async function savePioneerDraftAction(input: { title: string; body: string; kind: PioneerKind }) {
  const user = await requireUser();
  // Server actions are reachable with any payload shape; coerce before the store trims/slices.
  const kind = input && KINDS.has(input.kind) ? input.kind : "mixed";
  upsertPioneerDraft(user.id, {
    title: typeof input?.title === "string" ? input.title : "",
    body: typeof input?.body === "string" ? input.body : "",
    kind,
  });
}

export async function watchTodaysPlateAction() {
  const user = await requireUser();
  const profile = getProfile(user.id);
  if (!profile) redirect("/onboarding");
  const household = buildPioneerHousehold(user.id, profile);
  const plate = todayNutrition(user.id);
  upsertPioneerDraft(user.id, {
    title: "Today's plate",
    body: serializePlateDraft(plate.logs, household),
    kind: "nutrition",
  });
  redirect("/pioneer");
}
