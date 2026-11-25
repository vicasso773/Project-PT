import { type CheckFn, type ScanContext, type Outcome, fail, na, pass, warn } from "./context";

const noPsi = (ctx: ScanContext): Outcome =>
  na(`Google's speed test didn't run: ${(ctx.psiReason ?? "unavailable").replace(/\.$/, "")}.`, `La prueba de velocidad de Google no corrió.`);

const secs = (ms: number) => (ms / 1000).toFixed(1);
const mb = (b: number) => (b / 1024 / 1024).toFixed(1);

/** pass ≤ good, warn ≤ ok, fail above. */
function grade(value: number, good: number, ok: number, en: string, es: string): Outcome {
  if (value <= good) return pass(en, es);
  if (value <= ok) return warn(en, es);
  return fail(en, es);
}

export const speedChecks: Record<string, CheckFn> = {
  "perf-score": (ctx) => {
    const s = ctx.psi?.perfScore;
    if (!ctx.psi || s == null) return noPsi(ctx);
    const en = `Google scores the mobile site ${s}/100.`;
    const es = `Google le da ${s}/100 en celular.`;
    return s >= 90 ? pass(en, es) : s >= 50 ? warn(en, es) : fail(en, es);
  },
  lcp: (ctx) => {
    const v = ctx.psi?.lcpMs;
    if (!ctx.psi || v == null) return noPsi(ctx);
    return grade(v, 2500, 4000, `Main content appears after ${secs(v)} seconds on a phone (goal: under 2.5).`, `El contenido principal aparece en ${secs(v)} segundos (meta: menos de 2.5).`);
  },
  cls: (ctx) => {
    const v = ctx.psi?.cls;
    if (!ctx.psi || v == null) return noPsi(ctx);
    const word = v <= 0.1 ? "barely moves" : v <= 0.25 ? "jumps a bit" : "jumps around a lot";
    const wordEs = v <= 0.1 ? "casi no se mueve" : v <= 0.25 ? "se mueve un poco" : "se mueve mucho";
    return grade(v, 0.1, 0.25, `Layout shift ${v.toFixed(2)}: the page ${word} while loading.`, `Desplazamiento ${v.toFixed(2)}: la página ${wordEs} al cargar.`);
  },
  tbt: (ctx) => {
    const v = ctx.psi?.tbtMs;
    if (!ctx.psi || v == null) return noPsi(ctx);
    return grade(v, 200, 600, `The page is frozen for ${Math.round(v)} ms while loading (goal: under 200).`, `La página se congela ${Math.round(v)} ms al cargar (meta: menos de 200).`);
  },
  viewport: (ctx) => {
    const v = ctx.home.$('meta[name="viewport" i]').attr("content") ?? "";
    if (/width=device-width/i.test(v)) return pass("Set up to fit phone screens.", "Configurado para pantallas de celular.");
    if (ctx.psi?.audits.viewport) return pass("Fits phone screens (set by the site builder).", "Se adapta a celulares.");
    if (v) return warn(`Viewport tag is unusual: "${v}".`, `Etiqueta viewport inusual: "${v}".`);
    return fail("Not set up for phones; it shows a shrunken desktop page.", "No está configurado para celular; se ve la versión de computadora diminuta.");
  },
  "readable-text": (ctx) => {
    const f = ctx.psi?.audits.fontSize;
    if (f === true) return pass("Text is a readable size on phones.", "El texto es legible en celular.");
    if (f === false) return fail("Some text is too small to read on a phone without zooming.", "Parte del texto es muy pequeño para leer en celular.");
    if (!ctx.home.$('meta[name="viewport" i]').length && !ctx.psi?.audits.viewport)
      return fail("Without a mobile setup, text shows up tiny on phones.", "Sin configuración móvil, el texto se ve diminuto.");
    return na("Google's text-size test wasn't available for this scan.", "La prueba de tamaño de texto no estuvo disponible.");
  },
  "page-weight": (ctx) => {
    const b = ctx.psi?.totalBytes;
    if (!ctx.psi || b == null) return noPsi(ctx);
    return grade(b, 2 * 1024 * 1024, 4 * 1024 * 1024, `The home page is ${mb(b)} MB (goal: under 2 MB).`, `La página principal pesa ${mb(b)} MB (meta: menos de 2 MB).`);
  },
  "images-oversized": (ctx) => {
    const s = ctx.psi?.imageSavingsBytes;
    if (!ctx.psi) return noPsi(ctx);
    if (s == null) return na("Google didn't report image sizes for this scan.", "Google no reportó el tamaño de imágenes.");
    const kb = Math.round(s / 1024);
    return grade(s, 100 * 1024, 500 * 1024,
      kb ? `Images could be ${kb >= 1024 ? mb(s) + " MB" : kb + " KB"} smaller.` : "Images are well sized.",
      kb ? `Las imágenes podrían pesar ${kb >= 1024 ? mb(s) + " MB" : kb + " KB"} menos.` : "Las imágenes tienen buen tamaño.");
  },
};
