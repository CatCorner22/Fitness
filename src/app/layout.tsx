import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Comfortaa, Fraunces, Fredoka, JetBrains_Mono, Nunito, Outfit, Quicksand } from "next/font/google";
import { SaveToast } from "@/components/save-toast";
import { PALETTE_THEME_COLORS } from "@/lib/look";
import { getLook, getTheme } from "@/lib/prefs";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600"],
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Garanimal",
  applicationName: "Garanimal",
  description: "Simple household training and food logging.",
  appleWebApp: {
    capable: true,
    title: "Garanimal",
    statusBarStyle: "default",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  const look = await getLook();
  return {
    themeColor: PALETTE_THEME_COLORS[look.palette][theme],
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getTheme();
  const look = await getLook();
  return (
    <html
      lang="en"
      data-palette={look.palette}
      data-size={look.size}
      data-font={look.font}
      data-accent={look.accent}
      className={`${sans.variable} ${display.variable} ${nunito.variable} ${fredoka.variable} ${comfortaa.variable} ${quicksand.variable} ${mono.variable} h-full ${theme === "light" ? "light" : ""}`}
    >
      <body className="min-h-full antialiased">
        <Suspense fallback={null}>
          <SaveToast />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
