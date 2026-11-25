import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Precise Talons Site Scanner",
  description: "Scan a local business website and get a plain-English report.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121417",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
