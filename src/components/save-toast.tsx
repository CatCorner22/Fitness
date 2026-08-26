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
  look: "Look saved.",
  skipped: "Rest is fine.",
  "plan-full": "Today already has food — tap Replace if you want a new menu.",
  "yesterday-empty": "Nothing logged yesterday to copy.",
  assess: "Fitness check saved. Sessions will follow it.",
  diet: "Diet block on.",
  "diet-off": "Using training-goal calories again.",
  "fast-on": "Fast started.",
  "fast-off": "Fast ended.",
  "fast-edit": "Fast times updated.",
  "fast-open": "End or edit the open fast first.",
  "fast-order": "End has to be after start.",
  "fast-abort": "Fast discarded.",
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
