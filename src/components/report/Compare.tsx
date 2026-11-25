"use client";

import Link from "next/link";
import { CATEGORY_NAMES } from "@/lib/scanner/definitions";
import { CATEGORIES } from "@/lib/scanner/score";
import type { Lang, ScanReport } from "@/lib/scanner/types";
import { UI } from "@/lib/i18n";
import { StatusIcon, scoreColor } from "./bits";

export interface Competitor {
  input: string;
  id?: string;
  report?: ScanReport | null;
  error?: string;
}

const short = (s: string, n = 20) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Side-by-side scores. Works on a phone: at most 3 business columns. */
export function CompareTable({ report, competitors, lang, big = false }: { report: ScanReport; competitors: Competitor[]; lang: Lang; big?: boolean }) {
  const t = (x: { en: string; es: string }) => x[lang];
  const cols = [{ name: report.businessName, r: report as ScanReport | null | undefined, you: true, id: undefined as string | undefined, err: undefined as string | undefined }, ...competitors.map((c) => ({ name: c.report?.businessName ?? c.input, r: c.report, you: false, id: c.id, err: c.error }))];
  const cell = (pct: number | null | undefined) => (
    <span className="font-semibold tabular-nums" style={{ color: scoreColor(pct ?? null) }}>
      {pct === null || pct === undefined ? "—" : pct}
    </span>
  );
  return (
    <div className="keep-together overflow-hidden rounded-2xl border border-line bg-panel">
      <table className={`w-full table-fixed text-center ${big ? "text-xl sm:text-2xl" : ""}`}>
        <thead>
          <tr className="border-b border-line">
            <th className="w-[34%] p-3" />
            {cols.map((c, i) => (
              <th key={i} className={`break-words p-2 align-bottom text-sm font-semibold leading-tight sm:p-3 ${big ? "sm:text-lg" : ""} ${c.you ? "bg-sage/15 text-sage-light" : ""}`}>
                {c.you ? <span className="block text-xs uppercase tracking-wider">{t(UI.you)}</span> : null}
                {c.id && !big ? (
                  <Link href={`/r/${c.id}${lang === "es" ? "?lang=es" : ""}`} className="underline decoration-line underline-offset-4">
                    {short(c.name)}
                  </Link>
                ) : (
                  short(c.name)
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          <tr>
            <td className="p-3 text-left font-semibold">{t(UI.overall)}</td>
            {cols.map((c, i) => (
              <td key={i} className={`p-3 ${big ? "text-4xl" : "text-2xl"} font-serif ${c.you ? "bg-sage/15" : ""}`}>
                {c.r ? cell(c.r.score) : <span className="block font-sans text-xs leading-tight text-muted">{t(UI.couldntScan)}</span>}
              </td>
            ))}
          </tr>
          {CATEGORIES.map((cat) => (
            <tr key={cat}>
              <td className="p-3 text-left text-muted">{t(CATEGORY_NAMES[cat])}</td>
              {cols.map((c, i) => (
                <td key={i} className={`p-3 ${c.you ? "bg-sage/15" : ""}`}>
                  {c.r ? cell(c.r.categories.find((x) => x.category === cat)?.percent) : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!big && cols.some((c) => c.err) && (
        <ul className="border-t border-line p-3 text-left text-sm text-muted">
          {cols.filter((c) => c.err).map((c, i) => (
            <li key={i}>
              <span className="text-ivory">{c.name}:</span> {c.err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Checks a competitor passes that this business fails or only half-passes. */
export function theyHave(report: ScanReport, competitors: Competitor[]) {
  const out: { id: string; title: ScanReport["checks"][number]["title"]; status: ScanReport["checks"][number]["status"]; who: string[] }[] = [];
  for (const mine of report.checks) {
    if (mine.weight === 0 || (mine.status !== "fail" && mine.status !== "warn")) continue;
    const who = competitors.filter((c) => c.report?.checks.find((x) => x.id === mine.id)?.status === "pass").map((c) => c.report!.businessName);
    if (who.length) out.push({ id: mine.id, title: mine.title, status: mine.status, who });
  }
  return out.sort((a, b) => b.who.length - a.who.length);
}

export function TheyHaveList({ report, competitors, lang, big = false, limit = 99 }: { report: ScanReport; competitors: Competitor[]; lang: Lang; big?: boolean; limit?: number }) {
  const items = theyHave(report, competitors).slice(0, limit);
  if (!items.length) return null;
  return (
    <div className="mt-6">
      <h3 className={`font-semibold ${big ? "text-2xl sm:text-3xl" : "text-xl"}`}>{UI.theyHave[lang]}</h3>
      <ul className={`mt-3 space-y-2 ${big ? "text-xl sm:text-2xl" : ""}`}>
        {items.map((x) => (
          <li key={x.id} className="flex gap-3">
            <StatusIcon status={x.status} className={`${big ? "mt-1 h-7 w-7" : "mt-0.5 h-5 w-5"} shrink-0`} />
            <span>
              {x.title[lang]} <span className="text-muted">· {x.who.join(", ")}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
