// Helpers to read a downloaded HTML page.

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export interface Page {
  url: URL;
  html: string;
  $: CheerioAPI;
  /** Visible text, whitespace collapsed. */
  text: string;
  /** Text from the header + first part of the page ("above the fold" approximation). */
  topText: string;
  /** The top region's HTML (header + first chunk of body). */
  topHtml: string;
  /** Footer text (or the last part of the page if there's no <footer>). */
  footerText: string;
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

export function parsePage(html: string, url: string): Page {
  const $ = cheerio.load(html);
  const clean = cheerio.load(html);
  clean("script, style, noscript, svg, template, iframe").remove();
  const text = collapse(clean("body").text());

  const header = clean("header, [role=banner], #SITE_HEADER, .header, #header").first();
  const headerText = collapse(header.text());
  const topText = collapse(headerText + " " + text.slice(0, 1500));

  // Top HTML: header + the first ~25 links/buttons in page order.
  const firstActions = $("a, button")
    .slice(0, 25)
    .toArray()
    .map((el) => $.html(el))
    .join("\n");
  const topHtml = ($("header, [role=banner], #SITE_HEADER").first().html() ?? "") + "\n" + firstActions;

  const footer = clean("footer, [role=contentinfo], #SITE_FOOTER, .footer, #footer").last();
  const footerText = footer.length ? collapse(footer.text()) : text.slice(-1200);

  return { url: new URL(url), html, $, text, topText, topHtml, footerText };
}

/** US phone numbers like (312) 555-1234, 312.555.1234, 312-555-1234. */
export const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b([2-9]\d{2})\)?[\s.-]{0,2}(\d{3})[\s.-](\d{4})\b/g;

export function findPhones(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(PHONE_RE)) out.add(`${m[1]}${m[2]}${m[3]}`);
  return [...out];
}

export const formatPhone = (digits: string) =>
  digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : digits;

export const digitsOnly = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

const STREET_SUFFIX =
  "st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|pkwy|parkway|hwy|highway|way|pl|place|cir|circle|ter|terrace|trl|trail|sq|square";
export const ADDRESS_RE = new RegExp(
  `\\b\\d{1,6}\\s+(?:[NSEW]\\.?\\s+)?(?:[A-Za-z0-9.'-]+\\s+){0,4}(?:${STREET_SUFFIX})\\b\\.?`,
  "i",
);
export const ZIP_RE = /\b(?:IL|Illinois|IN|Indiana|WI|Wisconsin)\s+\d{5}\b/;

export function findAddress(text: string): string | null {
  const m = text.match(ADDRESS_RE);
  if (m) return m[0];
  const z = text.match(ZIP_RE);
  return z ? z[0] : null;
}

/** Absolute same-site links on the page. */
export function internalLinks(page: Page): { href: string; text: string }[] {
  const host = page.url.hostname.replace(/^www\./, "");
  const out = new Map<string, string>();
  page.$("a[href]").each((_, el) => {
    const raw = page.$(el).attr("href") ?? "";
    if (/^(mailto:|tel:|sms:|javascript:|#)/i.test(raw)) return;
    try {
      const u = new URL(raw, page.url);
      if (!/^https?:$/.test(u.protocol)) return;
      if (u.hostname.replace(/^www\./, "") !== host) return;
      u.hash = "";
      if (!out.has(u.toString())) out.set(u.toString(), collapse(page.$(el).text()));
    } catch {
      /* ignore bad hrefs */
    }
  });
  return [...out].map(([href, text]) => ({ href, text }));
}

/** All hrefs + iframe/script srcs on the page (for spotting booking/ordering/analytics tools). */
export function allResourceUrls(page: Page): string[] {
  const urls: string[] = [];
  page.$("a[href], iframe[src], script[src], link[href], form[action]").each((_, el) => {
    const v = page.$(el).attr("href") ?? page.$(el).attr("src") ?? page.$(el).attr("action");
    if (v) urls.push(v);
  });
  return urls;
}
