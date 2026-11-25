import { headers } from "next/headers";
import QRCode from "qrcode";
import type { Lang } from "./scanner/types";

/** The public base URL of this app (e.g. https://scanner.precisetalons.com). */
export async function baseUrl(): Promise<string> {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const reportPath = (id: string, lang: Lang = "en", sub = "") => `/r/${id}${sub}${lang === "es" ? "?lang=es" : ""}`;

/** QR code as an inline SVG string. Dark on light so phone cameras read it easily. */
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#121417", light: "#F2EFE6" },
  });
}

export const parseLang = (v: string | string[] | undefined): Lang => (v === "es" ? "es" : "en");
