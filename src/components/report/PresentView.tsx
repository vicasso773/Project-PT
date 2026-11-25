"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORY_NAMES, SERVICE_NAMES } from "@/lib/scanner/definitions";
import { CATEGORIES, LABEL_TEXT, fixFirst, pointsLost } from "@/lib/scanner/score";
import type { Lang, ScanReport, Service } from "@/lib/scanner/types";
import { EFFORT_TEXT, SERVICE_PITCH, UI } from "@/lib/i18n";
import { CategoryBar, ScoreRing, StatusIcon } from "./bits";
import { LangToggle } from "./ReportView";
import { type Competitor, CompareTable, TheyHaveList } from "./Compare";

const SERVICE_ORDER: Service[] = ["website", "gbp", "reviews", "leads", "ordering"];

/** Full-screen, big-text slides for showing an owner across the counter. Swipe, arrow keys, or tap the buttons. */
export function PresentView({ report, id, lang, shareUrl, qr, competitors = [] }: { report: ScanReport; id: string; lang: Lang; shareUrl: string; qr: string; competitors?: Competitor[] }) {
  const t = (x: { en: string; es: string }) => x[lang];
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => setSeen((prev) => (prev.has(index) ? prev : new Set(prev).add(index))), [index]);
  const label = report.label ? LABEL_TEXT[report.label] : null;
  const top = fixFirst(report.checks);
  const services = SERVICE_ORDER.map((s) => ({
    s,
    problems: report.checks.filter((c) => c.service === s && (c.status === "fail" || c.status === "warn")).sort((a, b) => pointsLost(b) - pointsLost(a)),
  })).filter((x) => x.problems.length);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // ── Slides ──
  const slides: React.ReactNode[] = [
    <div key="cover" className="flex flex-col items-center text-center">
      <p className="text-sm font-semibold tracking-[0.25em] text-sage-light">PRECISE TALONS</p>
      <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-7xl">{report.businessName}</h1>
      <p className="mt-2 text-lg text-muted sm:text-xl">{report.finalUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</p>
      <div className="mt-8">{seen.has(0) && <ScoreRing score={report.score} label={label ? t(label) : t(UI.couldntCheck)} size={300} />}</div>
    </div>,

    <div key="cats" className="mx-auto w-full max-w-2xl">
      <h2 className="font-serif text-4xl sm:text-6xl">{t(UI.categories)}</h2>
      <div className="mt-10 space-y-8 text-xl sm:text-2xl [&_.h-3]:h-5">
        {seen.has(1) &&
          CATEGORIES.map((c) => {
            const cat = report.categories.find((x) => x.category === c)!;
            return <CategoryBar key={c} name={t(CATEGORY_NAMES[c])} pct={cat.percent} max={cat.max} naText={t(UI.couldntCheck)} />;
          })}
      </div>
    </div>,

    ...(competitors.length
      ? [
          <div key="compare" className="mx-auto w-full max-w-3xl">
            <h2 className="mb-6 font-serif text-4xl sm:text-6xl">{t(UI.compareTitle)}</h2>
            <CompareTable report={report} competitors={competitors} lang={lang} big />
            <TheyHaveList report={report} competitors={competitors} lang={lang} big limit={3} />
          </div>,
        ]
      : []),

    ...(top.length
      ? [
          <div key="fix" className="mx-auto w-full max-w-3xl">
            <h2 className="font-serif text-4xl sm:text-6xl">{t(UI.fixFirst)}</h2>
            <ol className="mt-8 space-y-6">
              {top.map((c, i) => (
                <li key={c.id} className="flex gap-4 sm:gap-6">
                  <span className="w-8 shrink-0 font-serif text-4xl leading-none text-sage-light sm:text-5xl">{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <StatusIcon status={c.status} className="h-7 w-7 shrink-0" />
                      <h3 className="text-2xl font-semibold sm:text-3xl">{t(c.title)}</h3>
                    </div>
                    <p className="mt-1 hidden text-lg text-muted sm:block sm:text-xl">{t(c.found)}</p>
                    <p className="mt-1 text-lg sm:text-xl">
                      <span className="text-sage-light">→</span> {t(c.fix)} <span className="hidden text-muted sm:inline">· {t(EFFORT_TEXT[c.effort])}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>,
        ]
      : []),

    ...services.map(({ s, problems }) => (
      <div key={s} className="mx-auto w-full max-w-3xl">
        <p className="text-lg text-muted sm:text-xl">{t(UI.whatWeDo)}</p>
        <h2 className="mt-1 font-serif text-4xl text-sage-light sm:text-6xl">{t(SERVICE_NAMES[s])}</h2>
        <p className="mt-3 text-xl sm:text-2xl">{t(SERVICE_PITCH[s])}</p>
        <ul className="mt-8 space-y-4">
          {problems.slice(0, 6).map((c) => (
            <li key={c.id} className="flex gap-3 text-xl sm:text-2xl">
              <StatusIcon status={c.status} className="mt-1 h-7 w-7 shrink-0" />
              <span>{t(c.title)}</span>
            </li>
          ))}
          {problems.length > 6 && <li className="pl-10 text-lg text-muted">+{problems.length - 6}</li>}
        </ul>
      </div>
    )),

    <div key="close" className="flex flex-col items-center text-center">
      <h2 className="font-serif text-5xl leading-tight sm:text-7xl">{t(UI.letsFix)}</h2>
      <p className="mt-4 max-w-xl text-xl text-muted sm:text-2xl">{t(UI.closingSub)}</p>
      <div className="mt-8 w-56 overflow-hidden rounded-2xl sm:w-64" dangerouslySetInnerHTML={{ __html: qr }} />
      <p className="mt-3 text-muted">{t(UI.shareSub)}</p>
      <p className="mt-1 break-all font-mono text-sm text-muted">{shareUrl}</p>
    </div>,
  ];

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el) return;
      const n = Math.max(0, Math.min(slides.length - 1, i));
      el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
    },
    [slides.length],
  );

  // Keep the dot indicator in sync with swipes.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(index + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(index - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const fullscreen = () => {
    const d = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (document.fullscreenElement) document.exitFullscreen();
    else if (d.requestFullscreen) d.requestFullscreen().catch(() => {});
    else d.webkitRequestFullscreen?.();
  };

  const q = lang === "es" ? "?lang=es" : "";
  return (
    <div className="fixed inset-0 bg-charcoal">
      {/* Top controls: kept small and out of the way */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-charcoal via-charcoal/90 to-transparent p-3 pb-6 sm:p-4 sm:pb-8">
        <Link href={`/r/${id}${q}`} className="rounded-full border border-line bg-charcoal/80 px-4 py-2 text-sm backdrop-blur">
          ✕ {t(UI.exit)}
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle lang={lang} hrefFor={(l) => `/r/${id}/present${l === "es" ? "?lang=es" : ""}`} />
          <button onClick={fullscreen} className="hidden rounded-full border border-line bg-charcoal/80 px-4 py-2 text-sm backdrop-blur sm:block">
            ⛶ {t(UI.fullscreen)}
          </button>
        </div>
      </div>

      {/* Slides: native horizontal swipe with snapping */}
      <div ref={track} className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((slide, i) => (
          <section key={i} className="flex h-full w-full shrink-0 snap-center overflow-y-auto px-6 pb-24 pt-20 sm:px-12" aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}`}>
            <div className="m-auto w-full">{slide}</div>
          </section>
        ))}
      </div>

      {/* Bottom: back / dots / next */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-charcoal via-charcoal/90 to-transparent p-4 pt-10">
        <button onClick={() => go(index - 1)} disabled={index === 0} className="rounded-full border border-line bg-charcoal/80 px-5 py-3 backdrop-blur disabled:opacity-30">
          ← {t(UI.prev)}
        </button>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`${i + 1}`} className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-sage-light" : "w-2.5 bg-line"}`} />
          ))}
        </div>
        <button onClick={() => go(index + 1)} disabled={index === slides.length - 1} className="rounded-full bg-sage px-5 py-3 font-semibold text-charcoal disabled:opacity-30">
          {t(UI.next)} →
        </button>
      </div>
    </div>
  );
}
