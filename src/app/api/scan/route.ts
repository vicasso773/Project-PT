// POST /api/scan  { url, fresh? }  →  { id }   (runs on the server, never in the browser)

import { NextResponse } from "next/server";
import { ScanError, runScan } from "@/lib/scanner";
import { normalizeUrl } from "@/lib/scanner/fetchSite";
import { hostOf, recentScan, saveReport } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 120; // Google's speed test can take up to ~60 seconds

export async function POST(req: Request) {
  let body: { url?: string; fresh?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  let url: URL;
  try {
    url = normalizeUrl(body.url ?? "");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Same site scanned in the last hour? Reuse it.
  if (!body.fresh) {
    const recent = await recentScan(hostOf(url.toString()));
    if (recent) return NextResponse.json({ id: recent.id, cached: true });
  }

  const wait = rateLimit(clientIp(req.headers));
  if (wait) return NextResponse.json({ error: `Too many scans. Try again in ${wait} seconds.` }, { status: 429 });

  try {
    const report = await runScan(url.toString(), { fresh: body.fresh });
    const id = await saveReport(report);
    return NextResponse.json({ id });
  } catch (e) {
    if (e instanceof ScanError) return NextResponse.json({ error: e.message, code: e.code }, { status: 422 });
    console.error(e);
    return NextResponse.json({ error: "Something went wrong while scanning. Please try again." }, { status: 500 });
  }
}
