"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  saved: "Saved.",
  weight: "Weight logged.",
  checkin: "Check-in saved.",
  food: "Food logged.",
  workout: "Workout complete!",
  settings: "Settings updated.",
  skipped: "Rest is fine.",
  "plan-full": "Today already has food — tap Replace if you want a new menu.",
  "plan-missing": "That meal plan is no longer available.",
  assess: "Fitness check saved. Sessions will follow it.",
};

export function SaveToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = searchParams.get("toast");
  const message = key ? MESSAGES[key] : undefined;

  useEffect(() => {
    if (!key || !message) return;
    const clean = window.setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      next.delete("toast");
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, 2800);
    return () => window.clearTimeout(clean);
  }, [key, message, pathname, router]);

  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-sm shadow-lg"
    >
      {message}
    </div>
  );
}
