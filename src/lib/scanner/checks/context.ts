import type { Page } from "../page";
import type { PsiData } from "../pagespeed";
import type { PlacesInfo, Status, Text } from "../types";

export interface ScanContext {
  home: Page;
  /** Home + contact page (if we found one). Used for form/hours/address checks. */
  pages: Page[];
  /** Raw HTML looked nearly empty (JavaScript-built site). Missing things become "Couldn't check", not "fail". */
  thin: boolean;
  platform: string | null;
  psi: PsiData | null;
  psiReason: string | null;
  places: PlacesInfo | null;
  placesReason: string | null;
  robots: { status: "ok" | "missing" | "unknown"; body: string };
  sitemap: { status: "ok" | "missing" | "unknown"; url?: string };
  httpsWorks: boolean;
  httpRedirect: "https" | "none" | "unknown";
  links: { checked: number; broken: string[]; errors: number };
  favicon: "ok" | "default" | "missing" | "unknown";
  now: Date;
}

export interface Outcome {
  status: Status;
  found: Text;
}

export type CheckFn = (ctx: ScanContext) => Outcome;

/** Build bilingual text. */
export const L = (en: string, es: string): Text => ({ en, es });

export const pass = (en: string, es: string): Outcome => ({ status: "pass", found: L(en, es) });
export const warn = (en: string, es: string): Outcome => ({ status: "warn", found: L(en, es) });
export const fail = (en: string, es: string): Outcome => ({ status: "fail", found: L(en, es) });
export const na = (en: string, es: string): Outcome => ({ status: "na", found: L(en, es) });

/** Every URL we know the page uses: HTML links/scripts plus what the real browser loaded in PageSpeed. */
export function knownUrls(ctx: ScanContext, htmlUrls: string[]): string {
  return [...htmlUrls, ...(ctx.psi?.requestUrls ?? [])].join("\n");
}
