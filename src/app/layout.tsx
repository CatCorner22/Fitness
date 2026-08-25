import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SaveToast } from "@/components/save-toast";
import { getTheme } from "@/lib/prefs";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Garanimal",
  description: "Simple household training and food logging.",
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return {
    themeColor: theme === "light" ? "#f7f1e6" : "#14110d",
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getTheme();
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full ${theme === "light" ? "light" : ""}`}>
      <body className="min-h-full antialiased">
        <Suspense fallback={null}>
          <SaveToast />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
