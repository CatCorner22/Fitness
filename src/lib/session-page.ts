import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";

export async function requireAuthed(options?: { allowOnboarding?: boolean }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const profile = getProfile(user.id);
  if (!profile?.onboarded && !options?.allowOnboarding) redirect("/onboarding");
  if (!profile) redirect("/onboarding");
  return { user, profile };
}