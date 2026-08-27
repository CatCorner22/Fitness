import type { MetadataRoute } from "next";
import { DEFAULT_LOOK, PALETTE_THEME_COLORS } from "@/lib/look";

export default function manifest(): MetadataRoute.Manifest {
  const background = PALETTE_THEME_COLORS[DEFAULT_LOOK.palette].dark;
  return {
    name: "Garanimal",
    short_name: "Garanimal",
    description: "Simple household training and food logging.",
    start_url: "/",
    display: "standalone",
    background_color: background,
    theme_color: background,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
