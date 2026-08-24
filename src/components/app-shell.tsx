import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import type { ProfileRow } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/programs", label: "Programs" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/coach", label: "Coach" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

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
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full border border-line px-3 py-1 text-muted">
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
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-bg/95 px-2 py-2 backdrop-blur md:hidden">
        {LINKS.slice(0, 5).map((l) => (
          <Link key={l.href} href={l.href} className="py-2 text-center text-xs text-muted">
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}