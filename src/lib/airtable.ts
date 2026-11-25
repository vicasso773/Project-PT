// Optional: push a scan to Airtable as a lead.
// Needs AIRTABLE_TOKEN, AIRTABLE_BASE_ID and AIRTABLE_TABLE. Field names are listed in the README.

import { fixFirst } from "./scanner/score";
import type { ScanReport } from "./scanner/types";

export const airtableEnabled = () =>
  !!(process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_TABLE);

/** The row we send. Column names in your Airtable table must match these. */
export function leadFields(report: ScanReport, reportUrl: string) {
  const top = fixFirst(report.checks, 3)
    .map((c, i) => `${i + 1}. ${c.title.en}: ${c.found.en}`)
    .join("\n");
  return {
    "Business Name": report.businessName,
    Website: report.mode === "places" ? "" : report.finalUrl,
    Score: report.score,
    "Top Problems": top || "None found",
    "Report Link": reportUrl,
    "Scan Date": report.scannedAt.slice(0, 10),
  };
}

export async function sendLead(fields: ReturnType<typeof leadFields>): Promise<{ ok: true; recordId: string } | { ok: false; error: string }> {
  const base = process.env.AIRTABLE_BASE_ID!;
  const table = encodeURIComponent(process.env.AIRTABLE_TABLE!);
  try {
    const res = await fetch(`https://api.airtable.com/v0/${base}/${table}`, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
      // typecast lets Airtable convert text into dates/numbers/select options for you.
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg: string = json?.error?.message ?? json?.error?.type ?? `HTTP ${res.status}`;
      if (/UNKNOWN_FIELD_NAME|Unknown field name/i.test(msg))
        return { ok: false, error: `Your Airtable table is missing a column (${msg}). Check the column names in the README.` };
      if (res.status === 401 || res.status === 403) return { ok: false, error: "Airtable rejected the token. Check AIRTABLE_TOKEN and its access to this base." };
      if (res.status === 404) return { ok: false, error: "Airtable base or table not found. Check AIRTABLE_BASE_ID and AIRTABLE_TABLE." };
      return { ok: false, error: `Airtable error: ${msg}` };
    }
    return { ok: true, recordId: json.records?.[0]?.id ?? "" };
  } catch {
    return { ok: false, error: "Couldn't reach Airtable." };
  }
}
