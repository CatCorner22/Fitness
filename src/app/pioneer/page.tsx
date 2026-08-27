import { AppShell } from "@/components/app-shell";
import { PioneerStudio } from "@/components/pioneer-studio";
import { getPioneerConfig } from "@/lib/pioneer/config";
import { buildPioneerHousehold, defaultDraftKind } from "@/lib/pioneer/context";
import { isPioneerKilled } from "@/lib/pioneer/ladder";
import { readLadder } from "@/lib/pioneer/persist-ladder";
import { getPioneerDraft } from "@/lib/pioneer/store";
import { getAiOptIn } from "@/lib/prefs";
import { requireAuthed } from "@/lib/session-page";

export default async function PioneerPage() {
  const { user, profile } = await requireAuthed();
  const draft = getPioneerDraft(user.id);
  const household = buildPioneerHousehold(user.id, profile);
  const optIn = await getAiOptIn();
  const cfg = getPioneerConfig();
  const pioneerEnabled = optIn && cfg.enabled && !isPioneerKilled(readLadder());

  return (
    <AppShell user={user} profile={profile} wide>
      <h1 className="display text-4xl">Draft</h1>
      <p className="mt-2 text-muted">
        Write a week, a plate, or a cut check. Pioneer watches. It never writes the page.
      </p>
      <div className="mt-6">
        <PioneerStudio
          initialTitle={draft?.title ?? ""}
          initialBody={draft?.body ?? ""}
          initialKind={draft?.kind ?? defaultDraftKind(household)}
          household={household}
          pioneerEnabled={pioneerEnabled}
          extraNames={[user.displayName, user.username]}
        />
      </div>
    </AppShell>
  );
}
