"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KawaiiAvatar } from "@/components/kawaii-avatar";
import { LOOK_PREVIEW_EVENT } from "@/lib/look";

export function LookBrand({ avatarId }: { avatarId: string }) {
  const [id, setId] = useState(avatarId);

  useEffect(() => {
    setId(avatarId);
  }, [avatarId]);

  useEffect(() => {
    function onPreview(event: Event) {
      const avatar = (event as CustomEvent<{ avatar?: string }>).detail?.avatar;
      if (avatar) setId(avatar);
    }
    window.addEventListener(LOOK_PREVIEW_EVENT, onPreview);
    return () => window.removeEventListener(LOOK_PREVIEW_EVENT, onPreview);
  }, []);

  return (
    <Link href="/" className="flex items-center gap-2">
      <KawaiiAvatar id={id} size={40} />
      <span className="display text-2xl text-copper-2">Garanimal</span>
    </Link>
  );
}
