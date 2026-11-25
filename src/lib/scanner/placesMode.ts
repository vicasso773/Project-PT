// "No website" mode: scan just the business's Google listing and show what they're missing online.

import type { CheckDef } from "./definitions";
import { L, type Outcome, fail, na, pass, warn } from "./checks/context";
import { lookupPlace } from "./places";
import { ScanError } from "./fetchSite";
import { computeScore } from "./score";
import type { CheckResult, PlacesInfo, ScanReport, Text } from "./types";

type PlacesCheck = CheckDef & { run: (p: PlacesInfo) => Outcome };

const c = (def: PlacesCheck) => def;

export const PLACES_CHECKS: PlacesCheck[] = [
  c({
    id: "no-website", category: "conversion", weight: 20, service: "website", effort: "big", source: "google",
    title: { en: "Has a website", es: "Tiene sitio web" },
    whyItMatters: { en: "Most customers check a website before calling; without one, they pick a competitor who has one.", es: "La mayoría revisa el sitio web antes de llamar; sin uno, eligen a la competencia." },
    fix: { en: "Launch a fast, mobile-first website with tap-to-call and online booking.", es: "Lanzar un sitio rápido para celular, con llamada directa y reservas en línea." },
    run: (p) => (p.website ? pass(`Google lists a website: ${p.website}`, `Google muestra un sitio web: ${p.website}`) : fail("No website on the Google listing.", "La ficha de Google no tiene sitio web.")),
  }),
  c({
    id: "gbp-phone", category: "conversion", weight: 5, service: "gbp", effort: "quick", source: "google",
    title: { en: "Phone number on Google", es: "Teléfono en Google" },
    whyItMatters: { en: "Without a website, the Google listing's call button is how customers reach you.", es: "Sin sitio web, el botón de llamar en Google es cómo le contactan." },
    fix: { en: "Add the main phone number to the Google listing.", es: "Agregar el teléfono principal a la ficha de Google." },
    run: (p) => (p.phone ? pass(`Phone listed: ${p.phone}`, `Teléfono: ${p.phone}`) : fail("No phone number on the listing.", "La ficha no tiene teléfono.")),
  }),
  c({
    id: "gbp-hours", category: "conversion", weight: 5, service: "gbp", effort: "quick", source: "google",
    title: { en: "Hours on Google", es: "Horario en Google" },
    whyItMatters: { en: "People search 'open now'; listings without hours get skipped.", es: "La gente busca 'abierto ahora'; sin horario, le saltan." },
    fix: { en: "Add regular and holiday hours to the listing.", es: "Agregar horario normal y de días festivos." },
    run: (p) => (p.hours?.length ? pass("Hours are listed.", "El horario está publicado.") : fail("No hours on the listing.", "La ficha no tiene horario.")),
  }),
  c({
    id: "gbp-status", category: "seo", weight: 5, service: "gbp", effort: "quick", source: "google",
    title: { en: "Listed as open", es: "Aparece como abierto" },
    whyItMatters: { en: "If Google thinks you're closed, you won't show up at all.", es: "Si Google cree que cerró, no aparece en las búsquedas." },
    fix: { en: "Correct the business status on Google.", es: "Corregir el estado del negocio en Google." },
    run: (p) =>
      !p.status ? na("Google didn't report the status.", "Google no reportó el estado.")
      : p.status === "OPERATIONAL" ? pass("Google shows the business as open.", "Google muestra el negocio abierto.")
      : fail(`Google shows: ${p.status.replace(/_/g, " ").toLowerCase()}.`, `Google muestra: ${p.status.replace(/_/g, " ").toLowerCase()}.`),
  }),
  c({
    id: "gbp-category", category: "seo", weight: 3, service: "gbp", effort: "quick", source: "google",
    title: { en: "Business category set", es: "Categoría del negocio" },
    whyItMatters: { en: "The category decides which searches you appear in.", es: "La categoría decide en qué búsquedas aparece." },
    fix: { en: "Set the most specific main category (e.g. 'HVAC contractor', 'Barber shop').", es: "Elegir la categoría principal más específica." },
    run: (p) => (p.category ? pass(`Category: ${p.category}.`, `Categoría: ${p.category}.`) : warn("No specific category shown.", "No muestra una categoría específica.")),
  }),
  c({
    id: "gbp-rating", category: "trust", weight: 5, service: "reviews", effort: "medium", source: "google",
    title: { en: "Star rating", es: "Calificación con estrellas" },
    whyItMatters: { en: "Most people won't call a business under 4 stars.", es: "La mayoría no llama a un negocio con menos de 4 estrellas." },
    fix: { en: "Ask every happy customer for a review, automatically, right after the job.", es: "Pedir reseña a cada cliente satisfecho, automáticamente, al terminar." },
    run: (p) =>
      p.rating === undefined ? fail("No rating yet.", "Todavía no tiene calificación.")
      : p.rating >= 4.5 ? pass(`★ ${p.rating.toFixed(1)}`, `★ ${p.rating.toFixed(1)}`)
      : p.rating >= 4 ? warn(`★ ${p.rating.toFixed(1)}: good, but under 4.5.`, `★ ${p.rating.toFixed(1)}: bien, pero menos de 4.5.`)
      : fail(`★ ${p.rating.toFixed(1)}: below 4 stars.`, `★ ${p.rating.toFixed(1)}: menos de 4 estrellas.`),
  }),
  c({
    id: "gbp-reviews", category: "trust", weight: 5, service: "reviews", effort: "medium", source: "google",
    title: { en: "Number of reviews", es: "Cantidad de reseñas" },
    whyItMatters: { en: "More recent reviews means more trust and a higher spot on the map.", es: "Más reseñas recientes significan más confianza y mejor lugar en el mapa." },
    fix: { en: "Set up a review engine to collect reviews every week.", es: "Activar un motor de reseñas para recibir reseñas cada semana." },
    run: (p) => {
      const n = p.reviewCount ?? 0;
      const en = `${n} Google review${n === 1 ? "" : "s"}.`;
      const es = `${n} reseña${n === 1 ? "" : "s"} en Google.`;
      return n >= 50 ? pass(en, es) : n >= 10 ? warn(en, es) : fail(en, es);
    },
  }),
  c({
    id: "gbp-photos", category: "content", weight: 5, service: "gbp", effort: "quick", source: "google",
    title: { en: "Photos on Google", es: "Fotos en Google" },
    whyItMatters: { en: "Listings with photos get far more calls and direction requests.", es: "Las fichas con fotos reciben muchas más llamadas." },
    fix: { en: "Add 10+ real photos: storefront, team, work, food.", es: "Agregar 10 o más fotos reales: local, equipo, trabajos, comida." },
    run: (p) => {
      const n = p.photoCount ?? 0;
      const label = n >= 10 ? "10 or more photos" : `${n} photo${n === 1 ? "" : "s"}`;
      const labelEs = n >= 10 ? "10 o más fotos" : `${n} foto${n === 1 ? "" : "s"}`;
      return n >= 10 ? pass(`${label}.`, `${labelEs}.`) : n >= 3 ? warn(`${label}.`, `${labelEs}.`) : fail(`${label}.`, `${labelEs}.`);
    },
  }),
];

/** Build a report from a Google listing (pure function: easy to test). */
export function buildPlacesReport(p: PlacesInfo, input: string): ScanReport {
  const checks: CheckResult[] = PLACES_CHECKS.map(({ run, ...def }) => {
    const o = run(p);
    return { ...def, status: o.status, found: o.found };
  });
  const { score, label, categories } = computeScore(checks);
  const notes: Text[] = [
    L(
      `No-website mode: this report is based only on the Google listing "${p.name}"${p.address ? ` (${p.address})` : ""}. Make sure that's the right business.`,
      `Modo sin sitio web: este reporte se basa solo en la ficha de Google "${p.name}"${p.address ? ` (${p.address})` : ""}. Confirme que sea el negocio correcto.`,
    ),
  ];
  if (p.website)
    notes.push(L(`This business does have a website (${p.website}). Run a website scan for the full report.`, `Este negocio sí tiene sitio web (${p.website}). Haga un escaneo del sitio para el reporte completo.`));
  return {
    version: 1,
    mode: "places",
    inputUrl: input,
    finalUrl: p.mapsUrl ?? "",
    businessName: p.name,
    scannedAt: new Date().toISOString(),
    score,
    label,
    categories,
    checks,
    platform: null,
    notes,
    places: p,
    sources: { pagespeed: false, places: true, renderedFallback: false },
  };
}

/** Look the business up on Google and build the report. */
export async function runPlacesScan(query: string): Promise<ScanReport> {
  const q = query.trim();
  if (q.length < 3) throw new ScanError("invalid-url", "Type the business name and town, e.g. \"Lupe's Tacos Cicero\".");
  if (!process.env.GOOGLE_PLACES_API_KEY)
    throw new ScanError("unreachable", "No-website mode needs a Google Places key (GOOGLE_PLACES_API_KEY). See the README.");
  const r = await lookupPlace(q);
  if (!r.ok) throw new ScanError("not-found", r.reason);
  return buildPlacesReport(r.data, q);
}
