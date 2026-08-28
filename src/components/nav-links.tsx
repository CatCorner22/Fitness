"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, History, Settings, UtensilsCrossed, type LucideIcon } from "lucide-react";

export const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/nutrition", label: "Eat", icon: UtensilsCrossed },
  { href: "/progress", label: "History", icon: History },
  { href: "/settings", label: "You", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function linkClass(active: boolean, compact = false) {
  return [
    "rounded-2xl transition-colors",
    compact ? "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs" : "px-3 py-2 text-sm",
    active ? "bg-surface-2 text-copper-2" : "text-muted hover:bg-surface-2 hover:text-ink",
  ].join(" ");
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
      {NAV_LINKS.map((l) => {
        const active = isActive(pathname, l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`${linkClass(active)} inline-flex items-center gap-1.5`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-2 py-1.5 backdrop-blur lg:hidden" aria-label="Main">
      <div className="grid grid-cols-4 gap-1">
        {NAV_LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={linkClass(active, true)}
            >
              <Icon className={`h-5 w-5 ${active ? "text-copper-2" : ""}`} aria-hidden />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
