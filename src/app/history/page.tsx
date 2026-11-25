import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { LABEL_TEXT } from "@/lib/scanner/score";
import type { ScoreLabel } from "@/lib/scanner/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scan history | Precise Talons", robots: { index: false } };

const PAGE = 50;

const color = (s: number | null) =>
  s === null ? "var(--color-na)" : s < 50 ? "var(--color-score-red)" : s < 75 ? "var(--color-score-yellow)" : "var(--color-score-green)";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function History({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = q ? { OR: [{ businessName: { contains: q } }, { host: { contains: q.toLowerCase() } }, { url: { contains: q.toLowerCase() } }] } : {};
  const [rows, total] = await Promise.all([
    prisma.scan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE,
      skip: (page - 1) * PAGE,
      select: { id: true, createdAt: true, businessName: true, url: true, score: true, label: true, kind: true, leadSavedAt: true },
    }),
    prisma.scan.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: number) => `/history?${new URLSearchParams({ ...(q ? { q } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <div className="flex items-center justify-between py-4 text-sm">
        <Link href="/" className="font-semibold tracking-[0.18em] text-sage-light">PRECISE TALONS</Link>
        <Link href="/" className="rounded-full bg-sage px-4 py-2 font-medium text-charcoal hover:bg-sage-light">New scan</Link>
      </div>
      <h1 className="mt-4 font-serif text-4xl">Scan history</h1>
      <form className="mt-5 flex gap-2" action="/history">
        <label htmlFor="q" className="sr-only">Search</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Name or website"
          className="min-w-0 flex-1 rounded-2xl border border-line bg-panel px-4 py-3 text-lg text-ivory placeholder:text-na focus:border-sage"
        />
        <button className="rounded-2xl border border-line px-5 font-medium hover:bg-panel">Search</button>
      </form>
      <p className="mt-3 text-sm text-muted">
        {total} scan{total === 1 ? "" : "s"}{q ? ` matching "${q}"` : ""}
        {q && <> · <Link href="/history" className="underline underline-offset-4">clear</Link></>}
      </p>

      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/r/${r.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-panel-2">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-serif text-xl tabular-nums"
                style={{ borderColor: color(r.score), color: color(r.score) }}
              >
                {r.score ?? "—"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.businessName}</span>
                <span className="block truncate text-sm text-muted">
                  {r.kind === "places" ? "No website (Google listing)" : r.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </span>
              </span>
              <span className="shrink-0 text-right text-sm text-muted">
                <span className="block">{r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span className="block text-xs">
                  {r.label ? LABEL_TEXT[r.label as ScoreLabel].en : ""}
                  {r.leadSavedAt ? " · lead ✓" : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
        {!rows.length && <li className="px-4 py-8 text-center text-muted">{q ? "No scans match that search." : "No scans yet."}</li>}
      </ul>

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={link(page - 1)} className="rounded-full border border-line px-4 py-2">← Newer</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={link(page + 1)} className="rounded-full border border-line px-4 py-2">Older →</Link> : <span />}
        </nav>
      )}
    </main>
  );
}
