import { getProfile, getSession } from "@/lib/auth";
import { getPioneerConfig, PIONEER_MAX_CHARS } from "@/lib/pioneer/config";
import { buildPioneerHousehold } from "@/lib/pioneer/context";
import { isPioneerKilled } from "@/lib/pioneer/ladder";
import { readLadder } from "@/lib/pioneer/persist-ladder";
import { observePioneer } from "@/lib/pioneer/service";
import type { PioneerKind } from "@/lib/pioneer/types";
import { getAiOptIn } from "@/lib/prefs";

const KINDS = new Set<PioneerKind>(["training", "nutrition", "mixed"]);

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const profile = getProfile(user.id);
  if (!profile) return new Response("Profile missing", { status: 400 });

  let body: { text?: string; kind?: string };
  try {
    body = (await request.json()) as { text?: string; kind?: string };
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.slice(0, PIONEER_MAX_CHARS) : "";
  const kind = KINDS.has(body.kind as PioneerKind) ? (body.kind as PioneerKind) : undefined;
  const optIn = await getAiOptIn();
  const cfg = getPioneerConfig();
  const household = buildPioneerHousehold(user.id, profile);

  const result = await observePioneer({
    text,
    kind,
    household,
    extraNames: [user.displayName, user.username],
    allowPioneer: optIn && cfg.enabled && !isPioneerKilled(readLadder()),
  });

  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
