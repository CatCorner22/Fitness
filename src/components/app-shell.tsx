import type { ReactNode } from "react";
import { LookBrand } from "@/components/look-brand";
import { DesktopNav, MobileNav } from "@/components/nav-links";
import type { SessionUser } from "@/lib/auth";
import type { ProfileRow } from "@/lib/auth";
import { getLook } from "@/lib/prefs";

export async function AppShell({
  children,
}: {
  user: SessionUser;
  profile: ProfileRow | null;
  children: ReactNode;
}) {
  const look = await getLook();
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-28 pt-5 lg:max-w-2xl lg:pb-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <LookBrand avatarId={look.avatar} />
        <DesktopNav />
      </header>
      <main className="flex-1">{children}</main>
      <MobileNav />
    </div>
  );
}
