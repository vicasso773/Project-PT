"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  "Opening the website…",
  "Reading the page like a customer would…",
  "Checking phone, buttons and forms…",
  "Checking Google basics…",
  "Testing links…",
  "Running Google's mobile speed test (this is the slow part)…",
  "Adding it all up…",
];

export function ScanForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"site" | "places">("site");
  const [url, setUrl] = useState("");
  const [fresh, setFresh] = useState(false);
  const [showComp, setShowComp] = useState(false);
  const [comp, setComp] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 6000);
    return () => clearInterval(t);
  }, [busy]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "places"
            ? { mode, query: url }
            : { url, fresh, competitors: showComp ? comp.filter((c) => c.trim()) : [] },
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.id) throw new Error(json.error ?? "The scan failed. Please try again.");
      router.push(`/r/${json.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <div className="mb-3 grid grid-cols-2 rounded-2xl border border-line p-1" role="tablist" aria-label="What to scan">
        {([["site", "Has a website"], ["places", "No website"]] as const).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            disabled={busy}
            onClick={() => { setMode(m); setUrl(""); setError(null); }}
            className={`rounded-xl px-3 py-2.5 font-medium ${mode === m ? "bg-panel-2 text-ivory" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <label htmlFor="url" className="sr-only">{mode === "site" ? "Website address" : "Business name and town"}</label>
      <input
        id="url"
        type="text"
        inputMode={mode === "site" ? "url" : "text"}
        autoCapitalize={mode === "site" ? "none" : "words"}
        autoCorrect="off"
        spellCheck={false}
        placeholder={mode === "site" ? "joesbarbershop.com" : "Lupe's Tacos, Cicero"}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={busy}
        className="w-full rounded-2xl border border-line bg-panel px-5 py-4 text-xl text-ivory placeholder:text-na focus:border-sage disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={busy || !url.trim()}
        className="mt-3 w-full rounded-2xl bg-sage px-5 py-4 text-xl font-semibold text-charcoal transition hover:bg-sage-light disabled:opacity-50"
      >
        {busy ? "Scanning…" : mode === "site" ? "Scan website" : "Check Google listing"}
      </button>
      {mode === "site" && (<>
      <div className="mt-4 rounded-2xl border border-line">
        <button type="button" onClick={() => setShowComp((v) => !v)} disabled={busy} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left">
          <span className="font-medium">Compare with competitors <span className="text-muted">(optional, up to 2)</span></span>
          <span className="shrink-0 text-xl text-muted" aria-hidden>{showComp ? "−" : "+"}</span>
        </button>
        {showComp && (
          <div className="space-y-2 px-5 pb-4">
            {comp.map((c, i) => (
              <input
                key={i}
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label={`Competitor ${i + 1} website`}
                placeholder={`Competitor ${i + 1} website`}
                value={c}
                disabled={busy}
                onChange={(e) => setComp((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                className="w-full rounded-xl border border-line bg-charcoal px-4 py-3 text-lg text-ivory placeholder:text-na focus:border-sage"
              />
            ))}
          </div>
        )}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={fresh} onChange={(e) => setFresh(e.target.checked)} disabled={busy} className="h-4 w-4 accent-[#7a8b6f]" />
        Force a fresh scan (otherwise a scan from the last hour is reused)
      </label>
      </>)}

      {busy && (
        <div className="mt-6 rounded-2xl border border-line bg-panel p-5" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-sage transition-[width] duration-1000" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <p className="mt-3">{mode === "places" ? "Looking up the Google listing…" : STEPS[step]}</p>
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-2xl border border-score-red/40 bg-score-red/10 p-4" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
