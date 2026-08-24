"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Dumbbell,
  LayoutGrid,
  MessageCircle,
  Settings,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

export const NAV_LINKS: { href: string; label: string; icon: LucideIcon; mobilePrimary?: boolean }[] = [
  { href: "/", label: "Today", icon: CalendarDays, mobilePrimary: true },
  { href: "/programs", label: "Programs", icon: LayoutGrid, mobilePrimary: true },
  { href: "/nutrition", label: "Nutrition", icon: UtensilsCrossed, mobilePrimary: true },
  { href: "/coach", label: "Coach", icon: MessageCircle, mobilePrimary: true },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function linkClass(active: boolean, compact = false) {
  return [
    "rounded-full transition-colors",
    compact ? "flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px]" : "px-3 py-1.5 text-sm",
    active ? "bg-surface-2 text-copper-2" : "text-muted hover:bg-surface-2 hover:text-ink",
  ].join(" ");
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV_LINKS.map((l) => {
        const active = isActive(pathname, l.href);
        const Icon = l.icon;
        return (
          <Link key={l.href} href={l.href} className={`${linkClass(active)} inline-flex items-center gap-1.5`}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_LINKS.filter((l) => l.mobilePrimary);
  const secondary = NAV_LINKS.filter((l) => !l.mobilePrimary);
  const moreActive = secondary.some((l) => isActive(pathname, l.href));

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-bg/60 md:hidden"
          aria-label="Close menu"
          onClick={() => setMoreOpen(false)}
        />
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-1 py-1.5 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-0.5">
          {primary.map((l) => {
            const active = isActive(pathname, l.href);
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href} className={linkClass(active, true)} onClick={() => setMoreOpen(false)}>
                <Icon className={`h-4 w-4 ${active ? "text-copper-2" : ""}`} aria-hidden />
                <span>{l.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className={linkClass(moreActive || moreOpen, true)}
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
          >
            <Dumbbell className={`h-4 w-4 ${moreActive || moreOpen ? "text-copper-2" : ""}`} aria-hidden />
            <span>More</span>
          </button>
        </div>
        {moreOpen && (
          <div className="absolute inset-x-2 bottom-full mb-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
            {secondary.map((l) => {
              const active = isActive(pathname, l.href);
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${active ? "bg-surface-2 text-copper-2" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
                  onClick={() => setMoreOpen(false)}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
}
