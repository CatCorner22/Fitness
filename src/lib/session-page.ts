import { redirect } from "next/navigation";
import { getProfile, getSession, type ProfileRow, type SessionUser } from "@/lib/auth";

export async function requireAuthed(): Promise<{ user: SessionUser; profile: ProfileRow }>;
export async function requireAuthed(options: {
  allowOnboarding: true;
}): Promise<{ user: SessionUser; profile: ProfileRow | null }>;
export async function requireAuthed(options?: { allowOnboarding?: boolean }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const profile = getProfile(user.id);
  // Onboarding pages must stay reachable when the profile row is missing,
  // otherwise /onboarding would redirect to itself forever.
  if (!options?.allowOnboarding && !profile?.onboarded) redirect("/onboarding");
  return { user, profile };
}
