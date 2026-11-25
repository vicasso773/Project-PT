import { type CheckFn, fail, na, pass, warn } from "./context";

export const trustChecks: Record<string, CheckFn> = {
  https: ({ httpsWorks }) =>
    httpsWorks
      ? pass("The site loads securely (padlock shows).", "El sitio carga de forma segura (aparece el candado).")
      : fail("The site doesn't load securely; browsers show 'Not secure'.", "El sitio no es seguro; el navegador muestra 'No seguro'."),

  "http-redirect": ({ httpRedirect, httpsWorks }) => {
    if (!httpsWorks) return fail("There's no secure version to forward to.", "No hay versión segura a la cual redirigir.");
    if (httpRedirect === "https") return pass("http:// forwards to the secure https:// site.", "http:// redirige al sitio seguro https://.");
    if (httpRedirect === "none") return fail("Typing http:// leaves visitors on the insecure version.", "Al escribir http:// el visitante se queda en la versión insegura.");
    return na("We couldn't test the http:// address.", "No pudimos probar la dirección http://.");
  },

  copyright: ({ home, now }) => {
    const year = now.getFullYear();
    const years = [...(home.footerText + " " + home.text.slice(-3000)).matchAll(/(?:©|&copy;|\(c\)|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => Number(m[1]));
    if (!years.length) {
      if (/new Date\(\)\.getFullYear\(\)|getFullYear/i.test(home.html)) return pass("The footer year updates automatically.", "El año se actualiza solo.");
      return warn("No copyright year shown.", "No muestra año de copyright.");
    }
    const y = Math.max(...years);
    if (y > year + 1) return warn(`Footer says © ${y}, which looks like leftover template text.`, `El pie dice © ${y}, parece texto de plantilla.`);
    if (y >= year) return pass(`© ${y}: current.`, `© ${y}: actualizado.`);
    if (y === year - 1) return warn(`Footer still says © ${y}.`, `El pie todavía dice © ${y}.`);
    return fail(`Footer says © ${y}; the site looks out of date.`, `El pie dice © ${y}; el sitio parece abandonado.`);
  },

  privacy: ({ pages }) => {
    const p = pages[0];
    const has = p.$("a").toArray().some((el) => /privacy|privacidad/i.test(p.$(el).text() + " " + (p.$(el).attr("href") ?? "")));
    return has
      ? pass("Privacy policy is linked.", "Hay enlace a la política de privacidad.")
      : warn("No privacy policy link.", "No hay enlace a política de privacidad.");
  },

  favicon: ({ favicon, platform }) => {
    if (favicon === "ok") return pass("Site icon is set.", "El ícono del sitio está configurado.");
    if (favicon === "default") return warn(`Using the default ${platform ?? "builder"} icon, not their logo.`, `Usa el ícono predeterminado de ${platform ?? "la plataforma"}, no su logo.`);
    if (favicon === "unknown") return na("We couldn't check the site icon.", "No pudimos revisar el ícono.");
    return fail("No site icon; the browser tab shows a blank page.", "Sin ícono; la pestaña muestra una página en blanco.");
  },

  "broken-links": ({ links }) => {
    if (links.checked === 0) {
      if (links.errors > 0) return na("We couldn't test the site's links.", "No pudimos probar los enlaces.");
      return pass("No internal links to test.", "No hay enlaces internos para probar.");
    }
    const n = links.broken.length;
    if (n === 0) return pass(`Tested ${links.checked} links; none broken.`, `Probamos ${links.checked} enlaces; ninguno roto.`);
    const list = links.broken.slice(0, 3).map((u) => new URL(u).pathname).join(", ");
    const en = `${n} of ${links.checked} links are broken: ${list}`;
    const es = `${n} de ${links.checked} enlaces están rotos: ${list}`;
    return n === 1 ? warn(en, es) : fail(en, es);
  },
};
