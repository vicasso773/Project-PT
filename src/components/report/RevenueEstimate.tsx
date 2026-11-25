"use client";

import { useState } from "react";
import type { Lang } from "@/lib/scanner/types";
import { UI } from "@/lib/i18n";
import { Section } from "./bits";

/**
 * Off by default. Uses ONLY the three numbers typed in, and shows the formula.
 * visitors × extra conversion rate × average ticket = estimated revenue per month.
 */
export function RevenueEstimate({ lang }: { lang: Lang }) {
  const t = (x: { en: string; es: string }) => x[lang];
  const [on, setOn] = useState(false);
  const [visitors, setVisitors] = useState("");
  const [ticket, setTicket] = useState("");
  const [rate, setRate] = useState("");

  const v = Number(visitors);
  const tk = Number(ticket);
  const r = Number(rate);
  const ready = visitors !== "" && ticket !== "" && rate !== "" && v >= 0 && tk >= 0 && r >= 0;
  const result = ready ? v * (r / 100) * tk : 0;
  const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const num = (n: number) => n.toLocaleString("en-US");

  return (
    <div className={on ? "" : "no-print"}>
    <Section id="revenue" title={t(UI.revenueTitle)}>
      <div className="rounded-2xl border border-line bg-panel p-5">
        {!on ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted">{t(UI.revenueOff)}</p>
            <button onClick={() => setOn(true)} className="rounded-full border border-sage px-4 py-2 text-sage-light hover:bg-sage/10">
              {t(UI.revenueTurnOn)}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-panel-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">{t(UI.revenueEstimate)}</span>
              <button onClick={() => setOn(false)} className="no-print text-sm text-muted underline underline-offset-4">{t(UI.revenueTurnOff)}</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <NumberField label={t(UI.revenueVisitors)} value={visitors} onChange={setVisitors} placeholder="1000" />
              <NumberField label={t(UI.revenueTicket)} value={ticket} onChange={setTicket} placeholder="250" />
              <NumberField label={t(UI.revenueRate)} value={rate} onChange={setRate} placeholder="1" step="0.1" />
            </div>
            <div className="mt-5 rounded-xl bg-panel-2 p-4">
              {ready ? (
                <>
                  <p className="font-mono text-sm text-muted">
                    {num(v)} × {r}% × {money(tk)} =
                  </p>
                  <p className="mt-1 font-serif text-4xl">
                    {money(result)} <span className="text-base text-muted">{t(UI.revenuePerMonth)}</span>
                  </p>
                </>
              ) : (
                <p className="text-muted">{t(UI.revenueNeed)}</p>
              )}
            </div>
            <p className="mt-3 text-sm text-muted">
              {lang === "es" ? "Fórmula: visitantes al mes × % extra de clientes × venta promedio. " : "Formula: monthly visitors × extra % who become customers × average ticket. "}
              {t(UI.revenueExplain)}
            </p>
          </>
        )}
      </div>
    </Section>
    </div>
  );
}

function NumberField(props: { label: string; value: string; onChange: (v: string) => void; placeholder: string; step?: string }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{props.label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={props.step ?? "1"}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-line bg-charcoal px-3 py-3 text-lg text-ivory placeholder:text-na focus:border-sage"
      />
    </label>
  );
}
