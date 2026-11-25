import { allResourceUrls, digitsOnly, findAddress, findPhones, formatPhone } from "../page";
import { type CheckFn, fail, knownUrls, pass, warn } from "./context";

const CTA_RE =
  /\b(call( us| now| today)?|book( now| online| an? appointment)?|schedule( now| service| online)?|get (a |your )?(free )?(quote|estimate)|request (a )?(quote|estimate|service)|free (quote|estimate)|order( now| online)?|reserve|reservations?|make an appointment|start your order|contact us|llame|reserv[ae]|cotiza)\b/i;

const BOOKING_PROVIDERS: [string, RegExp][] = [
  ["Square", /square\.site|squareup\.com\/(appointments|book|store)|book\.squareup|app\.squareup\.com\/appointments/i],
  ["Toast", /toasttab\.com/i],
  ["Clover", /clover\.com\/online-ordering|clover\.com\/order/i],
  ["DoorDash", /doordash\.com|order\.online/i],
  ["Uber Eats", /ubereats\.com/i],
  ["Grubhub", /grubhub\.com|seamless\.com/i],
  ["ChowNow", /chownow\.com|ordering\.chownow/i],
  ["Slice", /slicelife\.com/i],
  ["OpenTable", /opentable\.com/i],
  ["Resy", /resy\.com/i],
  ["Tock", /exploretock\.com/i],
  ["Yelp reservations", /yelp\.com\/reservations/i],
  ["Booksy", /booksy\.com/i],
  ["Vagaro", /vagaro\.com/i],
  ["StyleSeat", /styleseat\.com/i],
  ["Fresha", /fresha\.com/i],
  ["GlossGenius", /glossgenius\.com/i],
  ["Schedulicity", /schedulicity\.com/i],
  ["Calendly", /calendly\.com/i],
  ["Acuity", /acuityscheduling\.com|as\.me\//i],
  ["Setmore", /setmore\.com/i],
  ["Speetra", /speetra\.com/i],
  ["Scheduling Engine", /schedulingengine\.com|scheduling-engine/i],
  ["Housecall Pro", /housecallpro\.com|book\.housecallpro/i],
  ["ServiceTitan", /servicetitan\.com|scheduler\.servicetitan/i],
  ["Jobber", /getjobber\.com|clienthub\.getjobber/i],
  ["Wix Bookings", /\/book-online|\/booking-calendar|wix-bookings/i],
  ["Squarespace Scheduling", /squarespacescheduling\.com/i],
  ["Tekmetric/Shopmonkey", /tekmetric\.com|shopmonkey\.(io|cloud)/i],
  ["Mindbody", /mindbodyonline\.com/i],
  ["Popmenu", /popmenu\.com/i],
  ["BentoBox ordering", /getbento\.com\/online-ordering|\/online-ordering/i],
];

export const conversionChecks: Record<string, CheckFn> = {
  "tel-link": ({ pages }) => {
    const tels = pages[0].$('a[href^="tel:"], a[href^="TEL:"]');
    if (tels.length) {
      let raw = (tels.first().attr("href") ?? "").replace(/^tel:/i, "");
      try { raw = decodeURIComponent(raw); } catch { /* keep as-is */ }
      const num = digitsOnly(raw).length === 10 ? formatPhone(digitsOnly(raw)) : raw;
      return pass(`Found a tap-to-call link (${num}).`, `Hay un enlace para llamar (${num}).`);
    }
    const phones = findPhones(pages[0].text);
    if (phones.length)
      return fail(
        `The number ${formatPhone(phones[0])} is on the page but isn't tappable.`,
        `El número ${formatPhone(phones[0])} aparece pero no se puede tocar para llamar.`,
      );
    return fail("No phone number or tap-to-call link on the home page.", "No hay teléfono ni enlace para llamar en la página principal.");
  },

  "phone-top": ({ home }) => {
    const telTop = /href=["']tel:/i.test(home.topHtml);
    const phones = findPhones(home.topText);
    if (telTop || phones.length)
      return pass(
        phones.length ? `Phone ${formatPhone(phones[0])} is at the top of the page.` : "A call link is at the top of the page.",
        phones.length ? `El teléfono ${formatPhone(phones[0])} está arriba.` : "Hay un enlace para llamar arriba.",
      );
    if (findPhones(home.text).length)
      return warn("The phone number is on the page, but not near the top.", "El teléfono aparece, pero no arriba.");
    return fail("No phone number near the top of the page.", "No hay teléfono arriba de la página.");
  },

  "cta-top": ({ home }) => {
    const $ = home.$;
    const candidates = $("header a, header button, [role=banner] a, #SITE_HEADER a, a, button").slice(0, 40).toArray();
    for (const el of candidates) {
      const t = $(el).text().replace(/\s+/g, " ").trim();
      if (t && t.length < 40 && CTA_RE.test(t))
        return pass(`Found a "${t}" button near the top.`, `Hay un botón "${t}" arriba.`);
    }
    const anywhere = $("a, button")
      .toArray()
      .map((el) => $(el).text().replace(/\s+/g, " ").trim())
      .find((t) => t && t.length < 40 && CTA_RE.test(t));
    if (anywhere)
      return warn(`There's a "${anywhere}" button, but it's not near the top.`, `Hay un botón "${anywhere}", pero no está arriba.`);
    return fail("No clear Call / Book / Quote / Order button.", "No hay un botón claro de Llamar / Reservar / Cotizar / Ordenar.");
  },

  "contact-form": ({ pages }) => {
    for (const p of pages) {
      const $ = p.$;
      const forms = $("form")
        .toArray()
        .filter((f) => {
          const html = $.html(f).toLowerCase();
          const isSearch = /type=["']search|role=["']search|name=["'](q|s)["']|action=["'][^"']*search/.test(html);
          const isNewsletter = $(f).find("input, textarea, select").length <= 2 && /newsletter|subscribe/.test(html);
          return !isSearch && !isNewsletter && $(f).find("input, textarea").length >= 2;
        });
      const embedded = /speetra|schedulingengine|leadconnectorhq|msgsndr|jotform|typeform|formspree|hsforms|hubspot.*form|gravityforms|gform_|wpforms|wpcf7|ninja-forms|forms\.gle|docs\.google\.com\/forms|wixui-form|form-block|sqs-block-form|ws-form|formstack|cognitoforms|housecallpro|servicetitan|getjobber/i;
      const embeds = embedded.test(p.html);
      const path = p.url.pathname;
      const where = p === pages[0] ? "on the home page" : `on the ${path} page`;
      const whereEs = p === pages[0] ? "en la página principal" : `en la página ${path}`;
      if (forms.length) {
        const action = $(forms[0]).attr("action") ?? "";
        if ((action && action !== "#") || embeds)
          return pass(`A contact form is ${where} and appears to send somewhere.`, `Hay un formulario ${whereEs} y parece enviarse correctamente.`);
        return warn(
          `A form is ${where}, but we couldn't confirm where it sends. Worth a test submission.`,
          `Hay un formulario ${whereEs}, pero no pudimos confirmar a dónde se envía. Conviene probarlo.`,
        );
      }
      if (embeds)
        return pass(`A contact form (form tool) is ${where}.`, `Hay un formulario ${whereEs}.`);
    }
    if (pages.length > 1)
      return warn(
        `No form in the code of the home page or ${pages.slice(1).map((p) => p.url.pathname).join(", ")}. It may load with JavaScript, so worth a quick check.`,
        `No hay formulario en el código de la página principal ni de ${pages.slice(1).map((p) => p.url.pathname).join(", ")}. Puede cargar con JavaScript; conviene revisarlo.`,
      );
    return fail("No contact or quote form, and no contact page found.", "No hay formulario de contacto ni página de contacto.");
  },

  booking: (ctx) => {
    const urls = knownUrls(ctx, ctx.pages.flatMap(allResourceUrls));
    const hits = BOOKING_PROVIDERS.filter(([, re]) => re.test(urls)).map(([n]) => n);
    if (hits.length)
      return pass(`Online booking/ordering found: ${hits.join(", ")}.`, `Reservas/pedidos en línea: ${hits.join(", ")}.`);
    const linkText = ctx.home.$("a, button")
      .toArray()
      .map((el) => ctx.home.$(el).text().trim())
      .find((t) => /\b(book (now|online|appointment)|order (now|online)|schedule (now|online|service))\b/i.test(t));
    if (linkText)
      return pass(`There's a "${linkText}" link for booking or ordering.`, `Hay un enlace "${linkText}" para reservar u ordenar.`);
    return fail("No online booking or ordering link found.", "No hay enlace para reservar u ordenar en línea.");
  },

  hours: ({ pages, places }) => {
    const re =
      /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*(?:[-–—to&,]+\s*(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?)?\s*:?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)|\b(open 24|24\/7|24 hours|open daily|hours of operation|business hours|horario)\b/i;
    for (const p of pages) {
      const m = p.text.match(re);
      if (m) return pass(`Hours are shown (e.g. "${m[0].slice(0, 40)}").`, `El horario aparece (p. ej. "${m[0].slice(0, 40)}").`);
      if (/openingHours/i.test(p.html)) return pass("Hours are listed in the page's business info.", "El horario aparece en los datos del negocio.");
    }
    if (places?.hours?.length)
      return fail("Hours aren't on the website (they are on Google).", "El horario no está en el sitio (sí en Google).");
    return fail("We couldn't find business hours on the site.", "No encontramos el horario en el sitio.");
  },

  address: ({ pages }) => {
    for (const p of pages) {
      const a = findAddress(p.text);
      if (a) return pass(`Address shown: "${a}".`, `Dirección visible: "${a}".`);
      if (/serv(ing|e|ices?) (the )?([A-Z][a-z]+(,| and| &)? ?){1,}(area|suburbs|county|chicagoland)/i.test(p.text) || /chicagoland|service area/i.test(p.text))
        return pass("A service area is described.", "Se describe el área de servicio.");
    }
    return fail("No address or service area found on the site.", "No hay dirección ni área de servicio en el sitio.");
  },

  "reviews-onsite": (ctx) => {
    const html = ctx.home.html;
    const widget = /review-?widget|reviewswidget|elfsight|trustindex|birdeye|podium|reviewsonmywebsite|nicejob|grade\.us|embedsocial|shapo|trustmary|sociablekit|widget\.reviews|yotpo|judge\.me|reviews-widget|google-reviews/i;
    if (widget.test(knownUrls(ctx, [html])))
      return pass("A reviews widget is on the home page.", "Hay un widget de reseñas en la página principal.");
    const $ = ctx.home.$;
    const heading = $("h1,h2,h3,h4,[class*=testimonial],[id*=testimonial],[class*=review],[id*=review]")
      .toArray()
      .some((el) => /testimonial|review|what (our )?(customers|clients|guests) (are )?say|happy (customers|clients)|reseñas|testimonios/i.test($(el).text() + " " + ($(el).attr("class") ?? "") + " " + ($(el).attr("id") ?? "")));
    if (heading) return pass("A reviews/testimonials section is on the home page.", "Hay una sección de reseñas/testimonios.");
    const reviewsPage = $("a[href]").toArray().find((el) => /^(customer )?(reviews|testimonials)\b|reseñas|testimonios/i.test($(el).text().trim()));
    if (reviewsPage)
      return pass(`Reviews are on a separate "${$(reviewsPage).text().trim()}" page (better if some are on the home page too).`, `Las reseñas están en una página aparte (mejor si también hay en la principal).`);
    if (/★{3,}|⭐|5[- ]star|five[- ]star|\d(\.\d)? stars?/i.test(ctx.home.text))
      return warn("Stars or a rating are mentioned, but no real reviews section.", "Se mencionan estrellas, pero no hay sección de reseñas.");
    return fail("No customer reviews or testimonials shown on the home page.", "No se muestran reseñas ni testimonios en la página principal.");
  },

  "sticky-mobile": ({ home }) => {
    const $ = home.$;
    const stickyRe = /sticky|fixed|floating|float-|call-bar|callbar|mobile-cta|bottom-bar|quick-action|click-to-call|phone-bar|action-bar/i;
    const targets = $('a[href^="tel:"], a, button')
      .toArray()
      .filter((el) => $(el).is('a[href^="tel:"]') || CTA_RE.test($(el).text()));
    for (const el of targets) {
      let node = $(el);
      for (let i = 0; i < 6 && node.length; i++) {
        const sig = `${node.attr("class") ?? ""} ${node.attr("id") ?? ""} ${node.attr("style") ?? ""}`;
        if (stickyRe.test(sig) || /position:\s*(fixed|sticky)/i.test(sig))
          return pass("A call/book button stays on screen while scrolling.", "Un botón de llamar/reservar se queda fijo al desplazarse.");
        node = node.parent();
      }
    }
    if (/QUICK_ACTION_BAR|quickActionBar/i.test(home.html))
      return pass("Wix mobile quick-action bar is turned on.", "La barra de acción rápida de Wix está activada.");
    return warn(
      "We didn't see a sticky call/book button for phones (these are sometimes added by scripts we can't see, so worth a quick look on a phone).",
      "No vimos un botón fijo de llamar/reservar en celular (a veces se agrega con scripts que no vemos; conviene revisarlo en un celular).",
    );
  },

  spanish: ({ home }) => {
    const $ = home.$;
    const lang = ($("html").attr("lang") ?? "").toLowerCase();
    const hreflang = $('link[hreflang^="es"]').length > 0;
    const switcher = $("a, button, option")
      .toArray()
      .some((el) => /^\s*(español|espanol|spanish|es)\s*$/i.test($(el).text()) || /\/es(\/|$)|lang=es/i.test($(el).attr("href") ?? ""));
    const tool = /weglot|gtranslate|translate\.google|conveythis|localizejs|bablic/i.test(home.html);
    if (lang.startsWith("es") || hreflang || switcher)
      return pass("The site has a Spanish option.", "El sitio tiene opción en español.");
    if (tool)
      return pass("A translation tool is installed (likely includes Spanish).", "Tiene una herramienta de traducción (probablemente incluye español).");
    return warn("No Spanish version found. A plus for our area, not a failure.", "No hay versión en español. Es un plus en la zona, no una falla.");
  },
};

