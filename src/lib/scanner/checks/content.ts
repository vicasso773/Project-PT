import { findAddress, findPhones } from "../page";
import { type CheckFn, fail, pass, warn } from "./context";

const SERVICES_RE =
  /\b(services|our services|what we do|menu|our menu|food menu|drinks|catering|repairs?|installation|maintenance|haircuts?|cuts|fades|shaves|pricing|prices|price list|treatments|packages|detailing packages|specials|roofing|siding|gutters|heating|cooling|brakes|oil change|servicios|menú)\b/i;

/** Same picture at different sizes counts once (drop size params, Wix resize paths). */
function photoKey(src: string): string {
  try {
    const u = new URL(src, "https://x.invalid");
    for (const k of ["w", "h", "width", "height", "q", "quality", "fit", "crop", "format", "auto", "fm", "dpr", "resize"]) u.searchParams.delete(k);
    return (u.pathname.replace(/\/v1\/(fill|fit|crop)\/.*$/, "").replace(/\/:\/(cr|rs)=.*$/, "") + u.search).toLowerCase();
  } catch {
    return src;
  }
}

export const contentChecks: Record<string, CheckFn> = {
  "services-listed": ({ home }) => {
    const $ = home.$;
    const navAndHeadings = $("nav a, header a, h1, h2, h3")
      .toArray()
      .map((el) => $(el).text().replace(/\s+/g, " ").trim())
      .filter((t) => t && t.length < 60);
    const hit = navAndHeadings.find((t) => SERVICES_RE.test(t));
    const menuFile = $("a[href]").toArray().some((el) => /menu.*\.pdf|\/menu|toasttab\.com.*menu/i.test($(el).attr("href") ?? ""));
    if (hit) return pass(`Services/menu are listed (e.g. "${hit}").`, `Servicios/menú listados (p. ej. "${hit}").`);
    if (menuFile) return pass("Links to a menu page.", "Enlaza a una página de menú.");
    if ($("ul li").length >= 5 && SERVICES_RE.test(home.text))
      return warn("Services are mentioned but not clearly laid out.", "Se mencionan servicios, pero no están bien organizados.");
    return fail("We couldn't find a clear list of services or a menu.", "No encontramos una lista clara de servicios o menú.");
  },

  about: ({ home }) => {
    const $ = home.$;
    const link = $("a, h1, h2, h3")
      .toArray()
      .some((el) => /about|our story|who we are|meet (the|our) (team|owner|barbers|chef)|nosotros|historia/i.test($(el).text() + " " + ($(el).attr("href") ?? "")));
    if (link) return pass("Has an About section or page.", "Tiene sección o página 'Quiénes somos'.");
    if (/family[- ]owned|since (19|20)\d{2}|established (in )?(19|20)\d{2}|years of experience/i.test(home.text))
      return warn("Mentions their history, but no real About section.", "Menciona su historia, pero sin sección 'Quiénes somos'.");
    return fail("No About section telling their story.", "No hay sección que cuente su historia.");
  },

  photos: ({ home }) => {
    const $ = home.$;
    const seen = new Set<string>();
    let stock = 0;
    $("img").each((_, el) => {
      const src = $(el).attr("src") ?? $(el).attr("data-src") ?? $(el).attr("srcset")?.split(" ")[0] ?? "";
      const label = `${src} ${$(el).attr("alt") ?? ""} ${$(el).attr("class") ?? ""}`;
      const w = Number($(el).attr("width") ?? 999);
      if (!src || src.startsWith("data:") || /\.svg|\.gif|logo|icon|badge|sprite|pixel|avatar|emoji|spacer/i.test(label) || w < 120) return;
      const key = photoKey(src);
      if (seen.has(key)) return;
      seen.add(key);
      if (/unsplash|shutterstock|istockphoto|gettyimages|pexels|pixabay|adobestock/i.test(src)) stock++;
    });
    // Background images set inline (common on builders)
    $("[style*=background]").each((_, el) => {
      const m = ($(el).attr("style") ?? "").match(/url\(["']?([^"')]+\.(?:jpe?g|png|webp|avif))/i);
      if (m) seen.add(photoKey(m[1]));
    });
    const n = seen.size;
    const real = n - stock;
    const stockNote = stock ? ` (${stock} look like stock photos)` : "";
    const stockNoteEs = stock ? ` (${stock} parecen fotos de stock)` : "";
    const en = `${n} photo${n === 1 ? "" : "s"} on the home page${stockNote}.`;
    const es = `${n} foto${n === 1 ? "" : "s"} en la página principal${stockNoteEs}.`;
    if (real >= 6) return pass(en, es);
    if (real >= 3) return warn(en, es);
    return fail(en, es);
  },

  "footer-contact": ({ home }) => {
    const f = home.footerText;
    const bits = [findPhones(f).length && "phone", findAddress(f) && "address", /@[\w-]+\.[a-z]{2,}/i.test(f) && "email"].filter(Boolean) as string[];
    const bitsEs = bits.map((b) => ({ phone: "teléfono", address: "dirección", email: "correo" })[b as "phone"]);
    if (bits.length >= 2) return pass(`Footer has ${bits.join(" and ")}.`, `El pie tiene ${bitsEs.join(" y ")}.`);
    if (bits.length === 1) return warn(`Footer only has ${bits[0]}.`, `El pie solo tiene ${bitsEs[0]}.`);
    return fail("No contact info at the bottom of the page.", "No hay datos de contacto al final de la página.");
  },
};
