import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { DesktopNav, MobileNav } from "@/components/nav-links";
import type { SessionUser } from "@/lib/auth";
import type { ProfileRow } from "@/lib/auth";

export function AppShell({
  user,
  profile,
  children,
}: {
  user: SessionUser;
  profile: ProfileRow | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-24 pt-6 md:pb-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <Link href="/" className="display text-2xl text-copper-2">
          Garanimal
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden rounded-full border border-line px-3 py-1 text-muted sm:inline">
            {user.displayName}
            {profile?.persona === "garanimal" ? " · Garanimal" : ""}
          </span>
          <form action={logoutAction}>
            <button className="text-muted underline-offset-2 hover:text-ink hover:underline" type="submit">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <MobileNav />
    </div>
  );
}
