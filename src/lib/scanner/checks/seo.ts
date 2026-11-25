import { allResourceUrls, digitsOnly, findPhones, formatPhone } from "../page";
import { type CheckFn, type ScanContext, fail, knownUrls, na, pass, warn } from "./context";

const PLACES =
  "chicago|chicagoland|illinois|\\bil\\b|naperville|aurora|joliet|elgin|evanston|schaumburg|cicero|berwyn|oak park|oak lawn|skokie|des plaines|arlington heights|palatine|wheaton|downers grove|lombard|elmhurst|bolingbrook|orland park|tinley park|oak brook|hinsdale|la grange|westmont|woodridge|lisle|plainfield|romeoville|lockport|homer glen|mokena|frankfort|new lenox|lansing|calumet|blue island|burbank|bridgeview|summit|melrose park|franklin park|niles|park ridge|glenview|northbrook|wilmette|winnetka|highland park|lake forest|waukegan|gurnee|mundelein|libertyville|vernon hills|buffalo grove|wheeling|mount prospect|rolling meadows|hoffman estates|streamwood|bartlett|carol stream|glendale heights|addison|bensenville|wood dale|itasca|villa park|lombard|west chicago|st\\.? charles|geneva|batavia|north aurora|oswego|yorkville|montgomery|crystal lake|mchenry|algonquin|huntley|harvey|chicago heights|park forest|matteson|hammond|gary|logan square|pilsen|wicker park|lincoln park|lakeview|bridgeport|little village|humboldt park|hyde park|rogers park|uptown|edgewater|west loop|south loop|bronzeville|chinatown|portage park|jefferson park|norwood park|garfield ridge|archer heights|brighton park|back of the yards|beverly|mount greenwood|avondale|irving park|albany park|lincoln square|andersonville|ravenswood|bucktown|ukrainian village|west town";

const SERVICES =
  "restaurant|pizza|tacos?|taqueria|mexican|grill|bar|cafe|coffee|bakery|catering|food|burgers?|hot dogs?|bbq|sushi|deli|diner|kitchen|barber|barbershop|haircuts?|salon|fades?|beard|hvac|heating|cooling|air conditioning|\\bac\\b|furnace|plumb(ing|er)|electric(al|ian)|roof(ing|er)|roofs|siding|gutters?|auto repair|mechanic|auto|car|brakes?|tires?|collision|body shop|detailing|detail|ceramic coating|car wash|landscap(e|ing)|lawn|cleaning|painting|remodel(ing)?|contractor|construction|repair|install(ation)?|service|services|dentist|dental|spa|nails|tattoo|towing";

const placeRe = new RegExp(`\\b(${PLACES})\\b`, "i");
const serviceRe = new RegExp(`\\b(${SERVICES})\\b`, "i");

const LOCAL_TYPES =
  /localbusiness|restaurant|foodestablishment|fastfoodrestaurant|cafeorcoffeeshop|barorpub|bakery|hvacbusiness|homeandconstructionbusiness|roofingcontractor|generalcontractor|plumber|electrician|housepainter|automotivebusiness|autorepair|autobodyshop|autowash|autodealer|hairsalon|barbershop|beautysalon|healthandbeautybusiness|dayspa|nailsalon|professionalservice|store|dentist|movingcompany|locksmith|homeandconstruction|contractor/i;

/* eslint-disable @typescript-eslint/no-explicit-any */
function jsonLdNodes(ctx: ScanContext): any[] {
  const out: any[] = [];
  const walk = (n: any) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(walk);
    out.push(n);
    if (n["@graph"]) walk(n["@graph"]);
  };
  ctx.home.$('script[type="application/ld+json"]').each((_, el) => {
    try {
      walk(JSON.parse(ctx.home.$(el).text()));
    } catch {
      /* invalid JSON-LD: ignore */
    }
  });
  return out;
}

const typeOf = (n: any) => ([] as string[]).concat(n?.["@type"] ?? []).join(",");

export const seoChecks: Record<string, CheckFn> = {
  title: (ctx) => {
    const t = ctx.home.$("title").first().text().replace(/\s+/g, " ").trim();
    if (!t) {
      if (ctx.psi?.audits.title) return warn("The title is only added by JavaScript after loading.", "El título solo se agrega con JavaScript.");
      return fail("The page has no title.", "La página no tiene título.");
    }
    const len = t.length;
    const local = placeRe.test(t) || serviceRe.test(t);
    const problems: string[] = [];
    const problemsEs: string[] = [];
    if (len < 30) { problems.push(`short (${len} characters)`); problemsEs.push(`corto (${len} caracteres)`); }
    if (len > 60) { problems.push(`long (${len} characters, Google cuts it off)`); problemsEs.push(`largo (${len} caracteres, Google lo corta)`); }
    if (!local) { problems.push("doesn't mention a city or service"); problemsEs.push("no menciona ciudad ni servicio"); }
    if (!problems.length) return pass(`"${t}" (${len} characters).`, `"${t}" (${len} caracteres).`);
    return warn(`"${t}": ${problems.join("; ")}.`, `"${t}": ${problemsEs.join("; ")}.`);
  },

  "meta-description": (ctx) => {
    const m = (ctx.home.$('meta[name="description" i]').attr("content") ?? "").replace(/&amp;/g, "&").trim();
    if (!m) return fail("No search description.", "No hay descripción para buscadores.");
    const len = m.length;
    if (len >= 70 && len <= 160) return pass(`${len} characters: "${m.slice(0, 90)}${len > 90 ? "…" : ""}"`, `${len} caracteres.`);
    return warn(
      `${len} characters (best is 70–160): "${m.slice(0, 90)}${len > 90 ? "…" : ""}"`,
      `${len} caracteres (lo ideal es 70–160).`,
    );
  },

  h1: (ctx) => {
    const h1s = ctx.home.$("h1").toArray().map((el) => ctx.home.$(el).text().replace(/\s+/g, " ").trim()).filter(Boolean);
    if (h1s.length === 1) return pass(`One main headline: "${h1s[0].slice(0, 80)}".`, `Un titular principal: "${h1s[0].slice(0, 80)}".`);
    if (h1s.length === 0) return fail("No main headline (H1) on the page.", "No hay titular principal (H1).");
    return warn(`${h1s.length} main headlines; there should be just one.`, `${h1s.length} titulares principales; debe haber solo uno.`);
  },

  schema: (ctx) => {
    const nodes = jsonLdNodes(ctx);
    const biz = nodes.find((n) => LOCAL_TYPES.test(typeOf(n)));
    const microdata = /itemtype=["']https?:\/\/schema\.org\/(LocalBusiness|Restaurant|AutoRepair|HVACBusiness|HairSalon|Plumber|RoofingContractor)/i.test(ctx.home.html);
    if (biz) {
      const missing: string[] = [];
      if (!biz.name) missing.push("name");
      if (!biz.address) missing.push("address");
      if (!biz.telephone) missing.push("phone");
      const type = typeOf(biz);
      if (!missing.length) return pass(`${type} business info with name, address and phone.`, `Datos ${type} con nombre, dirección y teléfono.`);
      return warn(`${type} business info found but missing: ${missing.join(", ")}.`, `Datos ${type} encontrados, pero falta: ${missing.join(", ")}.`);
    }
    if (microdata) return pass("Business info found (microdata).", "Datos del negocio encontrados (microdata).");
    if (nodes.some((n) => /organization|website/i.test(typeOf(n))))
      return warn("Only generic website info; no local business details for Google.", "Solo datos genéricos; faltan datos de negocio local.");
    return fail("No business info for Google (LocalBusiness schema).", "No hay datos de negocio para Google (schema LocalBusiness).");
  },

  "open-graph": (ctx) => {
    const $ = ctx.home.$;
    const has = (p: string) => !!$(`meta[property="og:${p}"]`).attr("content");
    const present = ["title", "description", "image"].filter(has);
    if (present.length === 3) return pass("Link preview has a title, description and image.", "La vista previa tiene título, descripción e imagen.");
    if (present.length === 0) return fail("No link preview set up; shared links look plain.", "Sin vista previa; los enlaces compartidos se ven simples.");
    const missing = ["title", "description", "image"].filter((p) => !has(p));
    return warn(`Link preview is missing: ${missing.join(", ")}.`, `A la vista previa le falta: ${missing.join(", ")}.`);
  },

  canonical: (ctx) => {
    const c = ctx.home.$('link[rel="canonical"]').attr("href");
    if (c) return pass(`Canonical: ${c}`, `Canónica: ${c}`);
    if (ctx.psi?.audits.canonical) return pass("Canonical tag added by the site builder.", "Etiqueta canónica agregada por el constructor.");
    return warn("No canonical tag.", "No hay etiqueta canónica.");
  },

  robots: ({ robots }) => {
    if (robots.status === "unknown") return na("We couldn't load robots.txt.", "No pudimos cargar robots.txt.");
    if (robots.status === "missing") return warn("No robots.txt file.", "No hay archivo robots.txt.");
    const blocksAll = /user-agent:\s*\*\s*[\r\n]+(?:[^\r\n]*[\r\n]+)*?disallow:\s*\/\s*$/im.test(robots.body);
    if (blocksAll) return fail("robots.txt tells Google NOT to index the site.", "robots.txt le dice a Google que NO indexe el sitio.");
    return pass("robots.txt is present and allows Google.", "robots.txt existe y permite a Google.");
  },

  sitemap: ({ sitemap }) => {
    if (sitemap.status === "ok") return pass(`Sitemap found: ${sitemap.url}`, `Mapa del sitio: ${sitemap.url}`);
    if (sitemap.status === "unknown") return na("We couldn't load the sitemap.", "No pudimos cargar el mapa del sitio.");
    return warn("No sitemap found.", "No se encontró mapa del sitio.");
  },

  "alt-text": (ctx) => {
    const imgs = ctx.home.$("img")
      .toArray()
      .filter((el) => {
        const w = Number(ctx.home.$(el).attr("width") ?? 99);
        const src = ctx.home.$(el).attr("src") ?? ctx.home.$(el).attr("data-src") ?? "";
        return w > 2 && !/facebook\.com\/tr|pixel|spacer|1x1/i.test(src);
      });
    if (!imgs.length) {
      if (ctx.psi?.audits.imageAlt === true) return pass("Images have descriptions (checked in the loaded page).", "Las imágenes tienen descripción.");
      if (ctx.psi?.audits.imageAlt === false) return fail("Some images are missing descriptions.", "Algunas imágenes no tienen descripción.");
      return na("No images in the page's HTML to check.", "No hay imágenes en el HTML para revisar.");
    }
    const withAlt = imgs.filter((el) => (ctx.home.$(el).attr("alt") ?? "").trim().length > 0).length;
    const pct = Math.round((withAlt / imgs.length) * 100);
    const msg = `${withAlt} of ${imgs.length} images have descriptions (${pct}%).`;
    const msgEs = `${withAlt} de ${imgs.length} imágenes tienen descripción (${pct}%).`;
    if (pct >= 90) return pass(msg, msgEs);
    if (pct >= 50) return warn(msg, msgEs);
    return fail(msg, msgEs);
  },

  analytics: (ctx) => {
    const blob = knownUrls(ctx, [ctx.home.html]);
    const ga4 = /gtag\/js\?id=G-|['"]G-[A-Z0-9]{6,}['"]|google-analytics\.com\/g\/collect/i.test(blob);
    const gtm = /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/i.test(blob);
    const ua = /google-analytics\.com\/analytics\.js|UA-\d{4,}-\d+/i.test(blob);
    const pixel = /connect\.facebook\.net\/[^"']*fbevents\.js|fbq\(\s*['"]init/i.test(blob);
    const found = [ga4 && "Google Analytics 4", gtm && "Google Tag Manager", pixel && "Meta Pixel"].filter(Boolean) as string[];
    if (ga4 || gtm) {
      const extra = pixel ? "" : " (no Meta Pixel for Facebook/Instagram ads)";
      const extraEs = pixel ? "" : " (sin Pixel de Meta para anuncios)";
      return pass(`Tracking installed: ${found.join(", ")}${extra}.`, `Medición instalada: ${found.join(", ")}${extraEs}.`);
    }
    if (ua) return fail("Only old Universal Analytics, which Google shut off in 2024; it records nothing now.", "Solo Universal Analytics antiguo, que Google apagó en 2024; ya no mide nada.");
    if (pixel) return warn("Meta Pixel found, but no Google Analytics.", "Hay Pixel de Meta, pero no Google Analytics.");
    if (ctx.thin && !ctx.psi) return na("The site loads with JavaScript and the speed test didn't run, so we couldn't check.", "El sitio carga con JavaScript y la prueba no corrió; no pudimos revisarlo.");
    return fail("No Google Analytics, Tag Manager or Meta Pixel found.", "No hay Google Analytics, Tag Manager ni Pixel de Meta.");
  },

  "gbp-link": (ctx) => {
    const urls = ctx.pages.flatMap(allResourceUrls).join("\n");
    if (/google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl|g\.page\/|business\.google\.com|search\.google\.com\/local|g\.co\/kgs|google\.com\/search\?[^"']*ludocid|maps\/embed/i.test(urls))
      return pass("Links to their Google listing or map.", "Enlaza a su ficha de Google o mapa.");
    return fail("No link to their Google Business Profile or Google Maps.", "No enlaza a su perfil de Google Business ni a Google Maps.");
  },

  nap: (ctx) => {
    const g = ctx.places;
    if (!g) return na(ctx.placesReason ?? "Google listing not available.", "No se pudo consultar la ficha de Google.");
    const text = ctx.pages.map((p) => p.text).join(" ");
    const telHrefs = ctx.pages.flatMap((p) => p.$('a[href^="tel:"]').toArray().map((el) => digitsOnly(p.$(el).attr("href") ?? "")));
    const sitePhones = new Set([...findPhones(text), ...telHrefs]);
    const issues: string[] = [];
    const issuesEs: string[] = [];
    if (g.phone) {
      const gp = digitsOnly(g.phone);
      if (!sitePhones.has(gp)) {
        issues.push(`Google's phone ${formatPhone(gp)} isn't on the site${sitePhones.size ? ` (site shows ${[...sitePhones].map(formatPhone).slice(0, 2).join(", ")})` : ""}`);
        issuesEs.push(`El teléfono de Google ${formatPhone(gp)} no aparece en el sitio`);
      }
    }
    if (g.address) {
      const streetNo = g.address.match(/^\d+/)?.[0];
      if (streetNo && !new RegExp(`\\b${streetNo}\\b`).test(text)) {
        issues.push(`Google's address (${g.address.split(",")[0]}) isn't on the site`);
        issuesEs.push(`La dirección de Google (${g.address.split(",")[0]}) no aparece en el sitio`);
      }
    }
    const nameWords = g.name.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !["the", "and", "inc", "llc"].includes(w));
    const nameHits = nameWords.filter((w) => text.toLowerCase().includes(w)).length;
    if (nameWords.length && nameHits / nameWords.length < 0.5) {
      issues.push(`Google's business name "${g.name}" doesn't match the site`);
      issuesEs.push(`El nombre en Google "${g.name}" no coincide con el sitio`);
    }
    if (!issues.length) return pass("Name, address and phone match the Google listing.", "Nombre, dirección y teléfono coinciden con Google.");
    return issues.length === 1 ? warn(issues[0] + ".", issuesEs[0] + ".") : fail(issues.join("; ") + ".", issuesEs.join("; ") + ".");
  },
};

export { jsonLdNodes, typeOf };
