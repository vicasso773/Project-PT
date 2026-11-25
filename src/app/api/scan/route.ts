// POST /api/scan  { url, fresh?, competitors?: string[] }  →  { id }
// Runs on the server, never in the browser.

import { NextResponse } from "next/server";
import { ScanError, runScan } from "@/lib/scanner";
import { runPlacesScan } from "@/lib/scanner/placesMode";
import { normalizeUrl } from "@/lib/scanner/fetchSite";
import type { CompareEntry } from "@/lib/scanner/types";
import { hostOf, recentScan, saveReport } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 120; // Google's speed test can take up to ~60 seconds

const MAX_COMPETITORS = 2;

export async function POST(req: Request) {
  let body: { url?: string; fresh?: boolean; competitors?: string[]; mode?: "site" | "places"; query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  // ── No-website mode: Google listing only ──
  if (body.mode === "places") {
    const wait = rateLimit(clientIp(req.headers));
    if (wait) return NextResponse.json({ error: `Too many scans. Try again in ${wait} seconds.` }, { status: 429 });
    try {
      const report = await runPlacesScan(body.query ?? "");
      return NextResponse.json({ id: await saveReport(report, { kind: "places" }) });
    } catch (e) {
      if (e instanceof ScanError) return NextResponse.json({ error: e.message }, { status: 422 });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  }

  let url: URL;
  const competitors: URL[] = [];
  try {
    url = normalizeUrl(body.url ?? "");
    for (const c of (body.competitors ?? []).map((s) => s.trim()).filter(Boolean).slice(0, MAX_COMPETITORS)) {
      const cu = normalizeUrl(c);
      if (hostOf(cu.toString()) !== hostOf(url.toString())) competitors.push(cu);
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Same site scanned in the last hour (and no competitors asked for)? Reuse it.
  if (!body.fresh && !competitors.length) {
    const recent = await recentScan(hostOf(url.toString()));
    if (recent) return NextResponse.json({ id: recent.id, cached: true });
  }

  const wait = rateLimit(clientIp(req.headers), 1 + competitors.length);
  if (wait) return NextResponse.json({ error: `Too many scans. Try again in ${wait} seconds.` }, { status: 429 });

  // Scan the business and its competitors at the same time.
  const [main, ...others] = await Promise.allSettled([
    runScan(url.toString(), { fresh: body.fresh }),
    ...competitors.map((c) => scanOrReuse(c, !!body.fresh)),
  ]);

  if (main.status === "rejected") {
    const e = main.reason;
    if (e instanceof ScanError) return NextResponse.json({ error: e.message, code: e.code }, { status: 422 });
    console.error(e);
    return NextResponse.json({ error: "Something went wrong while scanning. Please try again." }, { status: 500 });
  }

  const report = main.value;
  if (competitors.length) {
    report.compare = others.map((r, i): CompareEntry =>
      r.status === "fulfilled"
        ? { input: competitors[i].host, id: r.value }
        : { input: competitors[i].host, error: r.reason instanceof ScanError ? r.reason.message : "Scan failed." },
    );
  }
  const id = await saveReport(report);
  return NextResponse.json({ id });
}

/** Scan a competitor, or reuse its saved report from the last hour. Returns the saved report id. */
async function scanOrReuse(u: URL, fresh: boolean): Promise<string> {
  if (!fresh) {
    const recent = await recentScan(hostOf(u.toString()));
    if (recent) return recent.id;
  }
  return saveReport(await runScan(u.toString(), { fresh }));
}
