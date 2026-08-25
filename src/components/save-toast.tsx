"use client";

import { useEffect, useState } from "react";
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
};

export function SaveToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = searchParams.get("toast");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!key || !MESSAGES[key]) return;
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 2800);
    const clean = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("toast");
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, 3200);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(clean);
    };
  }, [key, pathname, router, searchParams]);

  if (!visible || !key) return null;
  return (
    <div
      role="status"
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-sm shadow-lg"
    >
      {MESSAGES[key] ?? "Saved."}
    </div>
  );
}
