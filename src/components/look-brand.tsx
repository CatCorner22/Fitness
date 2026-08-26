"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KawaiiAvatar } from "@/components/kawaii-avatar";
import { LOOK_PREVIEW_EVENT } from "@/lib/look";

export function LookBrand({ avatarId, name }: { avatarId: string; name?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const id = preview ?? avatarId;

  useEffect(() => {
    function onPreview(event: Event) {
      const avatar = (event as CustomEvent<{ avatar?: string }>).detail?.avatar;
      if (avatar) setPreview(avatar);
    }
    window.addEventListener(LOOK_PREVIEW_EVENT, onPreview);
    return () => window.removeEventListener(LOOK_PREVIEW_EVENT, onPreview);
  }, []);

  return (
    <Link href="/" className="flex items-center gap-2">
      <KawaiiAvatar id={id} size={40} />
      <span className="leading-none">
        <span className="display block text-2xl text-copper-2">Garanimal</span>
        {name ? <span className="mt-0.5 block text-xs font-medium text-muted">{name}</span> : null}
      </span>
    </Link>
  );
}
