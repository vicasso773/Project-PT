// runScan(url): downloads the site, gathers supporting data, runs every check, and scores it.

import { CATEGORY_NAMES, CHECKS } from "./definitions";
import { detectPlatform } from "./detectPlatform";
import { ScanError, checkHttpRedirect, fetchHomePage, fetchPage, normalizeUrl } from "./fetchSite";
import { type Page, findAddress, internalLinks, parsePage } from "./page";
import { runPageSpeed } from "./pagespeed";
import { lookupPlace } from "./places";
import { computeScore } from "./score";
import type { CheckResult, ScanReport, Text } from "./types";
import { type CheckFn, type ScanContext, L, na } from "./checks/context";
import { conversionChecks } from "./checks/conversion";
import { seoChecks, jsonLdNodes } from "./checks/seo";
import { speedChecks } from "./checks/speed";
import { trustChecks } from "./checks/trust";
import { contentChecks } from "./checks/content";

export { ScanError };
export type { ScanReport };

const REGISTRY: Record<string, CheckFn> = {
  ...conversionChecks,
  ...seoChecks,
  ...speedChecks,
  ...trustChecks,
  ...contentChecks,
};

// ── 1-hour cache (per server instance) ──
const CACHE_MS = 60 * 60 * 1000;
const cache = new Map<string, { at: number; report: ScanReport }>();
export const cacheKey = (u: URL) => (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "")).toLowerCase();

export interface ScanOptions {
  /** Skip the 1-hour cache. */
  fresh?: boolean;
  /** Skip PageSpeed (faster; speed checks become "Couldn't check"). */
  skipPageSpeed?: boolean;
  log?: (msg: string) => void;
}

export async function runScan(input: string, opts: ScanOptions = {}): Promise<ScanReport> {
  const log = opts.log ?? (() => {});
  const url = normalizeUrl(input);
  const key = cacheKey(url);
  const hit = cache.get(key);
  if (!opts.fresh && hit && Date.now() - hit.at < CACHE_MS) {
    log("Using cached scan (less than 1 hour old).");
    return hit.report;
  }

  // Google's speed test is slow, so start it right away in parallel.
  log("Starting Google PageSpeed (mobile)…");
  const psiPromise = opts.skipPageSpeed
    ? Promise.resolve({ ok: false as const, reason: "Skipped for this scan." })
    : runPageSpeed(url.toString());

  log(`Downloading ${url.host}…`);
  let homeRes: Awaited<ReturnType<typeof fetchHomePage>>;
  let blocked = false;
  try {
    homeRes = await fetchHomePage(url);
  } catch (e) {
    // The site blocks scanners. If Google's own speed test got in, build a partial report from that.
    if (!(e instanceof ScanError) || e.code !== "blocked") throw e;
    log(e.message + " Trying Google's view instead…");
    const psiEarly = await psiPromise;
    if (!psiEarly.ok) throw e;
    blocked = true;
    const finalUrl = psiEarly.data.finalUrl ?? url.toString();
    homeRes = { status: 200, finalUrl, contentType: "text/html", body: "<html><body></body></html>", headers: new Headers(), httpsWorks: finalUrl.startsWith("https:") };
  }
  const home = parsePage(homeRes.body, homeRes.finalUrl);
  const origin = new URL(homeRes.finalUrl).origin;
  const platform = detectPlatform(homeRes.body);
  const thin = !blocked && home.text.length < 250;

  log("Checking contact page, robots.txt, sitemap, links…");
  const [leadPages, robots, httpRedirect, links, favicon] = blocked
    ? [[], { status: "unknown" as const, body: "" }, "unknown" as const, { checked: 0, broken: [], errors: 1 }, "unknown" as const]
    : await Promise.all([
        fetchLeadPages(home),
        fetchRobots(origin),
        checkHttpRedirect(new URL(homeRes.finalUrl).host),
        checkLinks(home),
        checkFavicon(home, origin),
      ]);
  const sitemap: ScanContext["sitemap"] = blocked ? { status: "unknown" } : await findSitemap(origin, robots.body);

  log("Waiting for PageSpeed results…");
  const psi = await psiPromise;

  const businessName = guessBusinessName(home);
  let places: ScanContext["places"] = null;
  let placesReason: string | null = null;
  if (process.env.GOOGLE_PLACES_API_KEY) {
    log(`Looking up "${businessName}" on Google…`);
    const addr = findAddress(home.text);
    const p = await lookupPlace(addr ? `${businessName} ${addr}` : businessName, homeRes.finalUrl);
    if (p.ok) places = p.data;
    else placesReason = p.reason;
  } else {
    placesReason = "Google Places key not set, so we couldn't compare with the Google listing.";
  }

  const ctx: ScanContext = {
    home,
    pages: [home, ...leadPages],
    thin,
    platform,
    psi: psi.ok ? psi.data : null,
    psiReason: psi.ok ? null : psi.reason,
    places,
    placesReason,
    robots,
    sitemap,
    httpsWorks: homeRes.httpsWorks,
    httpRedirect,
    links,
    favicon,
    now: new Date(),
  };

  const checks: CheckResult[] = CHECKS.map((def) => {
    let outcome;
    try {
      outcome = REGISTRY[def.id](ctx);
    } catch (e) {
      outcome = na(`This check hit an error: ${(e as Error).message}`, "Esta revisión tuvo un error.");
    }
    // Honesty rule: on JavaScript-built pages, "missing" may just mean "we couldn't see it".
    if (blocked && def.source !== "pagespeed" && outcome.status !== "pass" && def.id !== "https") {
      outcome = na("This site blocks automated scanners, so we only have Google's speed-test view.", "Este sitio bloquea escáneres automáticos; solo tenemos la vista de la prueba de Google.");
    } else if (thin && def.source === "html" && outcome.status === "fail") {
      outcome = na(
        "This site builds its content with JavaScript, so we couldn't read this part.",
        "Este sitio arma su contenido con JavaScript, así que no pudimos leer esta parte.",
      );
    }
    return {
      id: def.id,
      category: def.category,
      weight: def.weight,
      status: outcome.status,
      title: def.title,
      found: outcome.found,
      whyItMatters: def.whyItMatters,
      fix: def.fix,
      service: def.service,
      effort: def.effort,
      source: def.source,
    };
  });

  const { score, label, categories } = computeScore(checks);

  const notes: Text[] = [];
  if (blocked)
    notes.push(L("This site blocks automated scanners. This is a partial report built from Google's speed test; many items couldn't be checked.", "Este sitio bloquea escáneres automáticos. Es un reporte parcial basado en la prueba de Google."));
  if (platform) notes.push(L(`Built on ${platform}.`, `Hecho con ${platform}.`));
  if (thin)
    notes.push(
      L(
        `The page's raw HTML was nearly empty (it's built with JavaScript)${psi.ok ? "; we used what Google's browser saw where possible" : ""}. Items we couldn't read are marked "Couldn't check".`,
        `El HTML de la página estaba casi vacío (se arma con JavaScript)${psi.ok ? "; usamos lo que vio el navegador de Google cuando fue posible" : ""}. Lo que no pudimos leer dice "No se pudo revisar".`,
      ),
    );
  if (!psi.ok) notes.push(L(`Speed checks skipped: ${psi.reason}`, "Se omitieron las pruebas de velocidad (Google PageSpeed no disponible)."));
  if (placesReason) notes.push(L(placesReason, "No se comparó con la ficha de Google."));
  const thinCats = categories.filter((c) => c.percent === null);
  if (thinCats.length)
    notes.push(L(`Not enough could be checked in: ${thinCats.map((c) => CATEGORY_NAMES[c.category].en).join(", ")}, so ${thinCats.length === 1 ? "it was" : "they were"} left out of the total.`, `No se pudo revisar lo suficiente en: ${thinCats.map((c) => CATEGORY_NAMES[c.category].es).join(", ")}; no cuenta en el total.`));
  const skipped = checks.filter((c) => c.status === "na" && c.weight > 0).length;
  if (skipped)
    notes.push(L(`${skipped} check${skipped === 1 ? "" : "s"} couldn't run and ${skipped === 1 ? "was" : "were"} left out of the score.`, `${skipped} revisiones no se pudieron hacer y no cuentan en la puntuación.`));

  const report: ScanReport = {
    version: 1,
    inputUrl: input,
    finalUrl: homeRes.finalUrl,
    businessName: places?.name || businessName,
    scannedAt: new Date().toISOString(),
    score,
    label,
    categories,
    checks,
    platform,
    notes,
    places,
    sources: { pagespeed: psi.ok, places: !!places, renderedFallback: (thin || blocked) && psi.ok },
  };
  cache.set(key, { at: Date.now(), report });
  return report;
}

// ───────────────────── helpers ─────────────────────

function guessBusinessName(home: Page): string {
  const biz = jsonLdNodes({ home } as ScanContext).find((n) => n?.name && n["@type"] && !/website|webpage/i.test(String(n["@type"])));
  if (biz?.name) return String(biz.name).trim();
  const og = home.$('meta[property="og:site_name"]').attr("content");
  if (og?.trim()) return og.trim();
  const title = home.$("title").first().text().trim();
  if (title) {
    const parts = title.split(/\s+[|\-–—:•]\s+/).map((s) => s.trim()).filter(Boolean);
    // The brand is usually the shortest segment, or the last one.
    const best = parts.length > 1 ? [...parts].sort((a, b) => a.length - b.length)[0] : parts[0];
    if (best && best.length <= 60) return best;
  }
  return home.url.hostname.replace(/^www\./, "");
}

/** Pages where leads happen (schedule/quote/book first, then contact). We read up to 2 of them. */
async function fetchLeadPages(home: Page): Promise<Page[]> {
  const homeUrl = home.url.toString().replace(/\/$/, "");
  const rank = (s: string) =>
    /schedul|quote|estimate|book|request|appointment/i.test(s) ? 0 : /contact|get-in-touch/i.test(s) ? 1 : 9;
  const links = internalLinks(home)
    .filter((l) => l.href.replace(/\/$/, "") !== homeUrl)
    .map((l) => ({ ...l, r: Math.min(rank(new URL(l.href).pathname), rank(l.text) + 0.5) }))
    .filter((l) => l.r < 9)
    .sort((a, b) => a.r - b.r)
    .slice(0, 2);
  const pages = await Promise.all(
    links.map(async (l) => {
      try {
        const res = await fetchPage(l.href, { timeoutMs: 10_000 });
        if (res.status >= 400 || !/html/i.test(res.contentType)) return null;
        return parsePage(res.body, res.finalUrl);
      } catch {
        return null;
      }
    }),
  );
  return pages.filter((p): p is Page => !!p);
}

async function fetchRobots(origin: string): Promise<ScanContext["robots"]> {
  try {
    const res = await fetchPage(`${origin}/robots.txt`, { timeoutMs: 10_000 });
    if (res.status === 200 && !/<html/i.test(res.body.slice(0, 500))) return { status: "ok", body: res.body };
    if (res.status === 404 || res.status === 410 || res.status === 200) return { status: "missing", body: "" };
    return { status: "unknown", body: "" };
  } catch {
    return { status: "unknown", body: "" };
  }
}

async function findSitemap(origin: string, robotsBody: string): Promise<ScanContext["sitemap"]> {
  const fromRobots = [...robotsBody.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  const candidates = [...fromRobots, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`].slice(0, 4);
  let anyAnswer = false;
  for (const c of candidates) {
    try {
      const res = await fetchPage(c, { timeoutMs: 10_000 });
      anyAnswer = true;
      if (res.status === 200 && /<(urlset|sitemapindex)/i.test(res.body.slice(0, 3000))) return { status: "ok", url: c };
    } catch {
      /* try the next one */
    }
  }
  return { status: anyAnswer ? "missing" : "unknown" };
}

async function checkFavicon(home: Page, origin: string): Promise<ScanContext["favicon"]> {
  const href = home.$('link[rel~="icon" i], link[rel="shortcut icon" i], link[rel="apple-touch-icon" i]').first().attr("href");
  if (href) {
    if (/parastorage\.com\/client\/pfavico|wix\.com\/favicon|squarespace\.com\/universal\/default-favicon|img1\.wsimg\.com\/isteam\/ip\/static\/favicon/i.test(href))
      return "default";
    return "ok";
  }
  try {
    const res = await fetchPage(`${origin}/favicon.ico`, { timeoutMs: 8_000 });
    if (res.status === 200 && /image|icon|octet/i.test(res.contentType)) return "ok";
    return "missing";
  } catch {
    return "unknown";
  }
}

/** Test up to 20 same-site links. 401/403/429 count as "protected", not broken. */
async function checkLinks(home: Page): Promise<ScanContext["links"]> {
  const targets = internalLinks(home)
    .map((l) => l.href)
    .filter((h) => !/\.(pdf|jpe?g|png|gif|webp|zip|mp4)$/i.test(h))
    .slice(0, 20);
  const broken: string[] = [];
  let checked = 0;
  let errors = 0;
  const queue = [...targets];
  const worker = async () => {
    while (queue.length) {
      const href = queue.shift()!;
      try {
        let res = await fetchPage(href, { method: "HEAD", timeoutMs: 8_000 });
        if (res.status === 405 || res.status === 403 || res.status === 404 || res.status >= 500)
          res = await fetchPage(href, { timeoutMs: 10_000 }); // some servers mishandle HEAD
        checked++;
        if (res.status >= 400 && ![401, 403, 429].includes(res.status)) broken.push(href);
      } catch {
        errors++;
      }
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
  return { checked, broken, errors };
}
