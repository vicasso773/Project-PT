"use client";

import { useEffect, useState } from "react";
import type { Status } from "@/lib/scanner/types";

/** Red / yellow / green by score. Only scores get these colors. */
export function scoreColor(pct: number | null): string {
  if (pct === null) return "var(--color-na)";
  if (pct < 50) return "var(--color-score-red)";
  if (pct < 75) return "var(--color-score-yellow)";
  return "var(--color-score-green)";
}

/** Big animated score ring. */
export function ScoreRing({ score, label, size = 240 }: { score: number | null; label: string; size?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (score === null) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setShown(Math.round(score * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const r = 88;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} role="img" aria-label={`${score ?? "—"} / 100, ${label}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-line)" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-serif text-7xl leading-none tabular-nums" style={{ fontSize: size * 0.3 }}>
          {score === null ? "—" : shown}
        </span>
        <span className="mt-1 text-sm text-muted">/ 100</span>
        <span className="mt-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ color, background: "color-mix(in srgb, currentColor 14%, transparent)" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/** A horizontal category bar. */
export function CategoryBar({ name, pct, max, naText }: { name: string; pct: number | null; max: number; naText: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct ?? 0), 150);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="font-medium">
          {name} <span className="text-sm text-muted">· {max}</span>
        </span>
        <span className="tabular-nums font-semibold" style={{ color: scoreColor(pct) }}>
          {pct === null ? naText : `${pct}%`}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: `${w}%`, background: scoreColor(pct) }} />
      </div>
    </div>
  );
}

/** Pass / warn / fail / couldn't-check icon. Shapes differ, not just colors. */
export function StatusIcon({ status, className = "h-6 w-6" }: { status: Status; className?: string }) {
  if (status === "pass")
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <circle cx="12" cy="12" r="11" fill="var(--color-score-green)" />
        <path d="M7 12.5l3.2 3.2L17 9" stroke="#121417" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (status === "warn")
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M12 2L23 21H1z" fill="var(--color-score-yellow)" strokeLinejoin="round" />
        <path d="M12 9v5" stroke="#121417" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="17.3" r="1.4" fill="#121417" />
      </svg>
    );
  if (status === "fail")
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <circle cx="12" cy="12" r="11" fill="var(--color-score-red)" />
        <path d="M8 8l8 8M16 8l-8 8" stroke="#121417" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-na)" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M8 12h8" stroke="var(--color-na)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "sage" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        tone === "sage" ? "bg-sage/20 text-sage-light" : "bg-panel-2 text-muted"
      }`}
    >
      {children}
    </span>
  );
}

export function Section({ id, title, sub, children }: { id?: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 py-8">
      <h2 className="font-serif text-3xl">{title}</h2>
      {sub && <p className="mt-1 text-muted">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
