import Link from "next/link";
import { DesktopNav, MobileNav } from "@/components/nav-links";
import type { SessionUser } from "@/lib/auth";
import type { ProfileRow } from "@/lib/auth";

export function AppShell({
  children,
}: {
  user: SessionUser;
  profile: ProfileRow | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-28 pt-5 lg:max-w-2xl lg:pb-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <Link href="/" className="display text-2xl text-copper-2">
          Garanimal
        </Link>
        <DesktopNav />
      </header>
      <main className="flex-1">{children}</main>
      <MobileNav />
    </div>
  );
}
