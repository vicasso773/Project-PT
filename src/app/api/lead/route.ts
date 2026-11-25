// POST /api/lead { id }  →  sends that report to Airtable as a lead.

import { NextResponse } from "next/server";
import { airtableEnabled, leadFields, sendLead } from "@/lib/airtable";
import { loadReport, prisma } from "@/lib/db";
import { baseUrl, reportPath } from "@/lib/share";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!airtableEnabled()) return NextResponse.json({ error: "Airtable isn't set up." }, { status: 400 });
  const { id, force } = (await req.json().catch(() => ({}))) as { id?: string; force?: boolean };
  const row = id ? await loadReport(id) : null;
  if (!row) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (row.leadSavedAt && !force) return NextResponse.json({ ok: true, already: true, savedAt: row.leadSavedAt });
  if (rateLimit("lead:" + clientIp(req.headers))) return NextResponse.json({ error: "Slow down a moment." }, { status: 429 });

  const result = await sendLead(leadFields(row.data, (await baseUrl()) + reportPath(row.id)));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  const saved = await prisma.scan.update({ where: { id: row.id }, data: { leadSavedAt: new Date() } });
  return NextResponse.json({ ok: true, savedAt: saved.leadSavedAt });
}
