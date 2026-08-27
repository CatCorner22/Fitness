import type { ReactNode } from "react";
import { LookBrand } from "@/components/look-brand";
import { DesktopNav, MobileNav } from "@/components/nav-links";
import type { SessionUser } from "@/lib/auth";
import type { ProfileRow } from "@/lib/auth";
import { getLook } from "@/lib/prefs";

export async function AppShell({
  user,
  children,
  wide,
}: {
  user: SessionUser;
  profile: ProfileRow | null;
  children: ReactNode;
  wide?: boolean;
}) {
  const look = await getLook();
  return (
    <div
      className={`relative z-10 mx-auto flex min-h-screen flex-col px-4 pb-28 pt-5 lg:pb-10 ${
        wide ? "max-w-lg lg:max-w-4xl" : "max-w-lg lg:max-w-2xl"
      }`}
    >
      <header className="mb-6 flex items-center justify-between gap-4">
        <LookBrand avatarId={look.avatar} name={user.displayName} />
        <DesktopNav />
      </header>
      <main className="flex-1">{children}</main>
      <MobileNav />
    </div>
  );
}
