"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORY_NAMES, SERVICE_NAMES } from "@/lib/scanner/definitions";
import { CATEGORIES, LABEL_TEXT, fixFirst, pointsLost } from "@/lib/scanner/score";
import type { CheckResult, Lang, ScanReport, Service } from "@/lib/scanner/types";
import { EFFORT_TEXT, SERVICE_PITCH, SOURCE_TEXT, STATUS_TEXT, UI } from "@/lib/i18n";
import { CategoryBar, Chip, ScoreRing, Section, StatusIcon, scoreColor } from "./bits";
import { RevenueEstimate } from "./RevenueEstimate";
import { type Competitor, CompareTable, TheyHaveList } from "./Compare";

const SERVICE_ORDER: Service[] = ["website", "gbp", "reviews", "leads", "ordering"];

export function ReportView({ report, id, lang = "en", shareUrl, qr, competitors = [] }: { report: ScanReport; id: string; lang?: Lang; shareUrl: string; qr: string; competitors?: Competitor[] }) {
  usePrintExpandsDetails();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const t = (x: { en: string; es: string }) => x[lang];
  const label = report.label ? LABEL_TEXT[report.label] : null;
  const date = new Date(report.scannedAt).toLocaleDateString(lang === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  const top = fixFirst(report.checks);
  const passed = report.checks.filter((c) => c.status === "pass").length;
  const issues = report.checks.filter((c) => c.status === "fail" || c.status === "warn").length;
  const host = report.finalUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
      {/* ── Top bar ── */}
      <div className="no-print flex items-center justify-between gap-3 whitespace-nowrap py-4 text-sm">
        <Link href="/" className="font-semibold tracking-[0.18em] text-sage-light">PRECISE TALONS</Link>
        <div className="flex items-center gap-2">
          <LangToggle lang={lang} hrefFor={(l) => `/r/${id}${l === "es" ? "?lang=es" : ""}`} />
          <Link href="/" aria-label={t(UI.newScan)} className="rounded-full border border-line px-3.5 py-2 hover:bg-panel">
            <span className="sm:hidden">＋</span>
            <span className="hidden sm:inline">{t(UI.newScan)}</span>
          </Link>
        </div>
      </div>
      <p className="print-only text-sm font-semibold tracking-[0.18em] text-sage-light">PRECISE TALONS · {t(UI.scoreTitle)}</p>

      {/* ── Header + score ── */}
      <header className="pt-4 text-center">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{report.businessName}</h1>
        <p className="mt-2 text-muted">
          <a href={report.finalUrl} target="_blank" rel="noreferrer" className="break-all underline decoration-line underline-offset-4 hover:text-ivory">{host}</a>
          <span className="mx-2 hidden sm:inline">·</span>
          <span className="block whitespace-nowrap sm:inline">{t(UI.scannedOn)} {date}</span>
        </p>
        {report.platform && <p className="mt-2"><Chip>{lang === "es" ? `Hecho con ${report.platform}` : `Built on ${report.platform}`}</Chip></p>}
        <div className="mt-8">
          <ScoreRing score={report.score} label={label ? t(label) : t(UI.couldntCheck)} />
        </div>
        <p className="mt-4 text-muted">
          <span className="text-ivory">{passed}</span> {t(UI.passed)} · <span className="text-ivory">{issues}</span> {t(UI.issues)}
        </p>
        <div className="no-print mt-6 grid grid-cols-3 gap-2 sm:mx-auto sm:max-w-lg">
          <Link href={`/r/${id}/present${lang === "es" ? "?lang=es" : ""}`} className="flex items-center justify-center rounded-2xl bg-sage px-3 py-3.5 font-semibold text-charcoal hover:bg-sage-light">
            {t(UI.present)}
          </Link>
          <button onClick={() => window.print()} className="flex items-center justify-center rounded-2xl border border-line px-3 py-3.5 font-medium hover:bg-panel">
            {t(UI.print)}
          </button>
          <CopyLinkButton url={shareUrl} lang={lang} />
        </div>
      </header>

      {/* ── Google listing ── */}
      {report.places && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-panel p-4 text-center">
          <div className="text-sm text-muted">{t(UI.googleListing)}</div>
          <div className="mt-1 text-lg">
            {report.places.rating !== undefined && <span className="font-semibold">★ {report.places.rating.toFixed(1)}</span>}
            {report.places.reviewCount !== undefined && <span className="text-muted"> · {report.places.reviewCount} {t(UI.reviews)}</span>}
          </div>
          {report.places.address && <div className="mt-1 text-sm text-muted">{report.places.address}</div>}
        </div>
      )}

      {/* ── Category bars ── */}
      <Section id="categories" title={t(UI.categories)}>
        <div className="keep-together print-compact space-y-5 rounded-2xl border border-line bg-panel p-5">
          {CATEGORIES.map((c) => {
            const cat = report.categories.find((x) => x.category === c)!;
            return <CategoryBar key={c} name={t(CATEGORY_NAMES[c])} pct={cat.percent} max={cat.max} naText={t(UI.couldntCheck)} />;
          })}
        </div>
      </Section>

      {/* ── Competitors ── */}
      {competitors.length > 0 && (
        <Section id="compare" title={t(UI.compareTitle)} sub={t(UI.compareSub)}>
          <CompareTable report={report} competitors={competitors} lang={lang} />
          <TheyHaveList report={report} competitors={competitors} lang={lang} />
        </Section>
      )}

      {/* ── Fix these first ── */}
      {top.length > 0 && (
        <Section id="fix-first" title={t(UI.fixFirst)} sub={t(UI.fixFirstSub)}>
          <ol className="space-y-3">
            {top.map((c, i) => (
              <li key={c.id} className="print-compact flex gap-4 rounded-2xl border border-line bg-panel p-4">
                <span className="font-serif text-3xl leading-none text-sage-light">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <StatusIcon status={c.status} className="mt-0.5 h-5 w-5 shrink-0" />
                    <h3 className="text-lg font-semibold leading-snug">{t(c.title)}</h3>
                  </div>
                  <p className="mt-1 text-muted">{t(c.found)}</p>
                  <p className="mt-2"><span className="text-sage-light">→</span> {t(c.fix)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip>{t(EFFORT_TEXT[c.effort])}</Chip>
                    <Chip tone="sage">{t(SERVICE_NAMES[c.service])}</Chip>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ── What we'd do ── */}
      <Section id="what-we-do" title={t(UI.whatWeDo)} sub={t(UI.whatWeDoSub)}>
        <div className="space-y-3">
          {SERVICE_ORDER.map((s) => {
            const problems = report.checks
              .filter((c) => c.service === s && (c.status === "fail" || c.status === "warn"))
              .sort((a, b) => pointsLost(b) - pointsLost(a));
            if (!problems.length) return null;
            return (
              <div key={s} className="keep-together print-compact rounded-2xl border border-line bg-panel p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-2xl text-sage-light">{t(SERVICE_NAMES[s])}</h3>
                  <span className="shrink-0 text-sm text-muted">{problems.length}</span>
                </div>
                <p className="mt-1 text-muted">{t(SERVICE_PITCH[s])}</p>
                <ul className="mt-3 space-y-2">
                  {problems.map((c) => (
                    <li key={c.id} className="flex gap-2">
                      <StatusIcon status={c.status} className="mt-0.5 h-5 w-5 shrink-0" />
                      <span><span className="font-medium">{t(c.title)}:</span> <span className="text-muted">{t(c.fix)}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {issues === 0 && <p className="text-muted">{t(UI.noProblems)}</p>}
        </div>
      </Section>

      {/* ── Revenue estimate (off by default) ── */}
      <RevenueEstimate lang={lang} />

      {/* ── Every check ── */}
      <Section id="all-checks" title={t(UI.allChecks)}>
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const list = report.checks.filter((c) => c.category === cat);
            const pct = report.categories.find((x) => x.category === cat)!.percent;
            return (
              <div key={cat}>
                <h3 className="mb-2 flex items-baseline justify-between text-xl font-semibold">
                  {t(CATEGORY_NAMES[cat])}
                  <span className="text-base tabular-nums" style={{ color: scoreColor(pct) }}>{pct === null ? t(UI.couldntCheck) : `${pct}%`}</span>
                </h3>
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
                  {list.map((c) => <CheckRow key={c.id} c={c} lang={lang} />)}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Notes ── */}
      {report.notes.length > 0 && (
        <Section id="notes" title={t(UI.notes)}>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            {report.notes.map((n, i) => <li key={i}>{t(n)}</li>)}
          </ul>
        </Section>
      )}

      {/* ── Share ── */}
      <Section id="share" title={t(UI.share)} sub={t(UI.shareSub)}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-panel p-5 sm:flex-row">
          <div className="w-44 shrink-0 overflow-hidden rounded-xl" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="min-w-0 text-center sm:text-left">
            <p className="break-all font-mono text-sm">{shareUrl}</p>
            <div className="no-print mt-3"><CopyLinkButton url={shareUrl} lang={lang} compact /></div>
          </div>
        </div>
      </Section>

      {/* ── How we scored this ── */}
      <Section id="how-scored" title={t(UI.howScored)}>
        <p className="text-muted">{t(UI.scoreMethod)}</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-panel-2 text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">{t(UI.check)}</th>
                <th className="px-3 py-2 font-medium">{t(UI.source)}</th>
                <th className="px-3 py-2 text-right font-medium">{t(UI.weight)}</th>
                <th className="px-3 py-2 font-medium">{t(UI.status)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-panel">
              {report.checks.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">{t(c.title)} <span className="text-muted">· {t(CATEGORY_NAMES[c.category])}</span></td>
                  <td className="px-3 py-2 text-muted">{t(SOURCE_TEXT[c.source])}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.weight ? `${c.weight} ${t(UI.pts)}` : t(UI.notScored)}</td>
                  <td className="px-3 py-2"><span className="inline-flex items-center gap-1.5"><StatusIcon status={c.status} className="h-4 w-4" />{t(STATUS_TEXT[c.status])}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </main>
  );
}

function CheckRow({ c, lang }: { c: CheckResult; lang: Lang }) {
  const t = (x: { en: string; es: string }) => x[lang];
  return (
    <details className="group" data-status={c.status}>
      <summary className="flex items-center gap-3 px-4 py-3.5 hover:bg-panel-2">
        <StatusIcon status={c.status} className="h-6 w-6 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{t(c.title)}</span>
          <span className="block truncate text-sm text-muted group-open:whitespace-normal">{t(c.found)}</span>
        </span>
        <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden>
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="space-y-2 px-4 pb-4 pl-13 text-[15px]">
        <p><span className="text-muted">{t(UI.why)}: </span>{t(c.whyItMatters)}</p>
        {c.status !== "pass" && c.status !== "na" && <p><span className="text-muted">{t(UI.fix)}: </span>{t(c.fix)}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <Chip>{t(STATUS_TEXT[c.status])}</Chip>
          {c.status !== "pass" && c.status !== "na" && <Chip>{t(EFFORT_TEXT[c.effort])}</Chip>}
          {c.status !== "pass" && c.status !== "na" && <Chip tone="sage">{t(SERVICE_NAMES[c.service])}</Chip>}
          <Chip>{t(SOURCE_TEXT[c.source])}</Chip>
        </div>
      </div>
    </details>
  );
}

function CopyLinkButton({ url, lang, compact }: { url: string; lang: Lang; compact?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={
        compact
          ? "rounded-full border border-sage px-4 py-2 text-sage-light hover:bg-sage/10"
          : "flex items-center justify-center rounded-2xl border border-line px-3 py-3.5 font-medium hover:bg-panel"
      }
      onClick={async () => {
        try {
          if (navigator.share && !compact) await navigator.share({ url });
          else await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* user cancelled share */
        }
      }}
    >
      {done ? UI.copied[lang] : compact ? UI.copyLink[lang] : lang === "es" ? "Compartir" : "Share"}
    </button>
  );
}

/** EN | ES switch. */
export function LangToggle({ lang, hrefFor }: { lang: Lang; hrefFor: (l: Lang) => string }) {
  return (
    <div className="flex overflow-hidden rounded-full border border-line text-sm" role="group" aria-label="Language / Idioma">
      {(["en", "es"] as Lang[]).map((l) => (
        <Link
          key={l}
          href={hrefFor(l)}
          replace
          scroll={false}
          aria-current={l === lang ? "true" : undefined}
          className={`px-3 py-2 font-semibold ${l === lang ? "bg-ivory text-charcoal" : "text-muted hover:text-ivory"}`}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

/** When printing, open every problem row so the PDF has the details (passing rows stay one line). */
function usePrintExpandsDetails() {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(document.querySelectorAll<HTMLDetailsElement>('details[data-status="fail"], details[data-status="warn"]')).filter((d) => !d.open);
      opened.forEach((d) => (d.open = true));
    };
    const after = () => opened.forEach((d) => (d.open = false));
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
}
