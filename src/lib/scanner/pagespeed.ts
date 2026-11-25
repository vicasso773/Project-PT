// Google PageSpeed Insights (mobile run). Free key: PAGESPEED_API_KEY.

export interface PsiData {
  perfScore: number | null; // 0–100
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  totalBytes: number | null;
  imageSavingsBytes: number | null;
  /** Lighthouse audit pass/fail (null = audit not present in this Lighthouse version). */
  audits: {
    fontSize: boolean | null;
    viewport: boolean | null;
    title: boolean | null;
    metaDescription: boolean | null;
    imageAlt: boolean | null;
    canonical: boolean | null;
  };
  /** Every URL the real browser loaded (used to spot analytics/booking tools on JS-heavy sites). */
  requestUrls: string[];
  finalUrl: string | null;
}

export type PsiResult = { ok: true; data: PsiData } | { ok: false; reason: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function runPageSpeed(url: string, apiKey = process.env.PAGESPEED_API_KEY): Promise<PsiResult> {
  const qs = new URLSearchParams({ url, strategy: "mobile" });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) qs.append("category", c);
  if (apiKey) qs.set("key", apiKey);

  let json: any;
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, {
      signal: AbortSignal.timeout(90_000), // Google's test itself can take 30–60 s
    });
    json = await res.json();
    if (!res.ok) {
      const msg: string = json?.error?.message ?? `HTTP ${res.status}`;
      if (res.status === 429)
        return { ok: false, reason: apiKey ? "PageSpeed daily limit reached for this key." : "PageSpeed needs an API key (the free no-key allowance is used up). Add PAGESPEED_API_KEY." };
      if (/Lighthouse returned error/i.test(msg))
        return { ok: false, reason: "Google's speed test couldn't load the site (it may block bots or be too slow)." };
      return { ok: false, reason: `PageSpeed error: ${msg.slice(0, 160)}` };
    }
  } catch (e: any) {
    if (e?.name === "TimeoutError") return { ok: false, reason: "Google's speed test timed out after 90 seconds." };
    return { ok: false, reason: "Couldn't reach Google PageSpeed." };
  }

  const lh = json?.lighthouseResult;
  if (!lh) return { ok: false, reason: "PageSpeed returned no results." };
  const a = lh.audits ?? {};
  const num = (id: string): number | null => (typeof a[id]?.numericValue === "number" ? a[id].numericValue : null);
  const pass = (id: string): boolean | null =>
    a[id] && a[id].scoreDisplayMode !== "notApplicable" && a[id].score !== null && a[id].score !== undefined
      ? a[id].score >= 0.9
      : null;

  // Image savings: older Lighthouse has 3 "opportunity" audits, newer has one "insight".
  let imageSavings: number | null = null;
  for (const id of ["uses-responsive-images", "uses-optimized-images", "modern-image-formats", "image-delivery-insight"]) {
    const s = a[id]?.details?.overallSavingsBytes;
    if (typeof s === "number") imageSavings = (imageSavings ?? 0) + s;
    else if (a[id] && a[id].score === 1 && imageSavings === null) imageSavings = 0;
  }
  if (a["image-delivery-insight"]?.details?.overallSavingsBytes !== undefined) {
    // If the new insight exists, don't double count with the older audits.
    imageSavings = a["image-delivery-insight"].details.overallSavingsBytes;
  }

  const requestUrls: string[] = (a["network-requests"]?.details?.items ?? [])
    .map((i: any) => i?.url)
    .filter((u: unknown): u is string => typeof u === "string");

  const perf = lh.categories?.performance?.score;
  return {
    ok: true,
    data: {
      perfScore: typeof perf === "number" ? Math.round(perf * 100) : null,
      lcpMs: num("largest-contentful-paint"),
      cls: num("cumulative-layout-shift"),
      tbtMs: num("total-blocking-time"),
      totalBytes: num("total-byte-weight"),
      imageSavingsBytes: imageSavings,
      audits: {
        fontSize: pass("font-size"),
        viewport: pass("viewport"),
        title: pass("document-title"),
        metaDescription: pass("meta-description"),
        imageAlt: pass("image-alt"),
        canonical: pass("canonical"),
      },
      requestUrls,
      finalUrl: lh.finalDisplayedUrl ?? lh.finalUrl ?? null,
    },
  };
}
