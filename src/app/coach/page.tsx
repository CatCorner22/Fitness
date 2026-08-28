import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SpiritCoachChat } from "@/components/spirit-coach-chat";
import { historyForUser } from "@/lib/coach/engine";
import { getAiOptIn } from "@/lib/prefs";
import { aiEnabled } from "@/lib/spirit/config";
import { parseCoachMeta } from "@/lib/spirit/client-utils";
import { requireAuthed } from "@/lib/session-page";
import type { UIMessage } from "ai";

function historyToUIMessages(
  history: ReturnType<typeof historyForUser>,
): UIMessage[] {
  return history.map((msg) => {
    const parsed = msg.role === "coach" ? parseCoachMeta(msg.content) : { text: msg.content, citeIds: [] };
    return {
      id: msg.id,
      role: msg.role === "coach" ? "assistant" : "user",
      metadata: { citeIds: parsed.citeIds },
      parts: [{ type: "text" as const, text: parsed.text }],
    };
  });
}

export default async function CoachPage() {
  const { user, profile } = await requireAuthed();
  const history = historyForUser(user.id);
  const optIn = await getAiOptIn(user.id);
  const initialMessages = historyToUIMessages(history);

  return (
    <AppShell user={user} profile={profile}>
      <h1 className="display text-4xl">Coach</h1>
      <p className="mt-2 text-muted">
        Ask about a lift, a swap, or the clock. Local rules always answer. A cloud model is optional under You.
      </p>
      <SpiritCoachChat initialMessages={initialMessages} aiAvailable={optIn && aiEnabled()} />
      <p className="mt-6 text-sm">
        <Link href="/knowledge" className="text-copper-2">
          Read the guide →
        </Link>
      </p>
    </AppShell>
  );
}
