// The catalog of every check. Weights inside a category add up to that
// category's points (Conversion 30, SEO 25, Speed 25, Trust 10, Content 10).
// Text is written for a business owner, not a developer.

import type { Category, Effort, Service, Source, Text } from "./types";

export interface CheckDef {
  id: string;
  category: Category;
  weight: number;
  service: Service;
  effort: Effort;
  source: Source;
  title: Text;
  whyItMatters: Text;
  fix: Text;
}

export const CATEGORY_POINTS: Record<Category, number> = {
  conversion: 30,
  seo: 25,
  speed: 25,
  trust: 10,
  content: 10,
};

const d = (def: CheckDef) => def;

export const CHECKS: CheckDef[] = [
  // ───────────── Conversion (30) ─────────────
  d({
    id: "tel-link", category: "conversion", weight: 5, service: "website", effort: "quick", source: "html",
    title: { en: "Tap-to-call phone link", es: "Teléfono para llamar con un toque" },
    whyItMatters: { en: "Most visitors are on their phone; if they can't tap to call, many won't call at all.", es: "La mayoría visita desde el celular; si no pueden tocar para llamar, muchos no llaman." },
    fix: { en: "Make every phone number a tap-to-call link.", es: "Convertir cada número de teléfono en un enlace para llamar." },
  }),
  d({
    id: "phone-top", category: "conversion", weight: 3, service: "website", effort: "quick", source: "html",
    title: { en: "Phone number visible at the top", es: "Teléfono visible arriba" },
    whyItMatters: { en: "People ready to buy look for the number first; it should be the first thing they see.", es: "Quien está listo para comprar busca el número primero; debe verse de inmediato." },
    fix: { en: "Put the phone number in the header on every page.", es: "Poner el teléfono en el encabezado de todas las páginas." },
  }),
  d({
    id: "cta-top", category: "conversion", weight: 5, service: "website", effort: "quick", source: "html",
    title: { en: "Clear action button at the top", es: "Botón de acción claro arriba" },
    whyItMatters: { en: "A clear 'Call', 'Book' or 'Get a quote' button tells visitors exactly what to do next.", es: "Un botón claro de 'Llamar', 'Reservar' o 'Cotizar' le dice al cliente qué hacer." },
    fix: { en: "Add one bold button at the top: Call, Book, Get a Quote or Order.", es: "Agregar un botón visible arriba: Llamar, Reservar, Cotizar u Ordenar." },
  }),
  d({
    id: "contact-form", category: "conversion", weight: 4, service: "leads", effort: "medium", source: "html",
    title: { en: "Contact or quote form", es: "Formulario de contacto o cotización" },
    whyItMatters: { en: "Some customers won't call; a form catches them, even after hours.", es: "Algunos clientes no llaman; un formulario los captura, incluso fuera de horario." },
    fix: { en: "Add a short form that goes straight to your phone, with an instant text-back.", es: "Agregar un formulario corto que llegue a su celular, con respuesta automática por texto." },
  }),
  d({
    id: "booking", category: "conversion", weight: 4, service: "ordering", effort: "medium", source: "html",
    title: { en: "Online booking or ordering", es: "Reservas o pedidos en línea" },
    whyItMatters: { en: "Customers expect to book or order online in a few taps, any time of day.", es: "Los clientes esperan reservar u ordenar en línea en pocos toques, a cualquier hora." },
    fix: { en: "Connect online booking or ordering (Square, Toast, Clover or similar) and link it at the top.", es: "Conectar reservas o pedidos en línea (Square, Toast, Clover u otro) y ponerlo arriba." },
  }),
  d({
    id: "hours", category: "conversion", weight: 2, service: "website", effort: "quick", source: "html",
    title: { en: "Business hours shown", es: "Horario visible" },
    whyItMatters: { en: "If people can't tell whether you're open, they go to someone who shows it.", es: "Si no saben si está abierto, se van con quien sí lo muestra." },
    fix: { en: "List your hours on the home page and footer.", es: "Mostrar el horario en la página principal y el pie de página." },
  }),
  d({
    id: "address", category: "conversion", weight: 2, service: "website", effort: "quick", source: "html",
    title: { en: "Address or service area shown", es: "Dirección o área de servicio visible" },
    whyItMatters: { en: "Customers and Google both need to know where you are or which towns you serve.", es: "Clientes y Google necesitan saber dónde está o qué zonas atiende." },
    fix: { en: "Show your address (or the towns you serve) on every page.", es: "Mostrar la dirección (o las zonas que atiende) en cada página." },
  }),
  d({
    id: "reviews-onsite", category: "conversion", weight: 3, service: "reviews", effort: "medium", source: "html",
    title: { en: "Reviews or testimonials on the site", es: "Reseñas o testimonios en el sitio" },
    whyItMatters: { en: "Seeing real customer reviews is often what convinces someone to call you instead of a competitor.", es: "Ver reseñas reales suele ser lo que convence a alguien de llamarle a usted y no a la competencia." },
    fix: { en: "Show your best Google reviews on the home page, updated automatically.", es: "Mostrar sus mejores reseñas de Google en la página principal, actualizadas solas." },
  }),
  d({
    id: "sticky-mobile", category: "conversion", weight: 2, service: "website", effort: "quick", source: "html",
    title: { en: "Call/Book button that stays on screen (mobile)", es: "Botón de Llamar/Reservar fijo en el celular" },
    whyItMatters: { en: "A button that follows the visitor as they scroll means they can act the moment they decide.", es: "Un botón que sigue al visitante al desplazarse permite actuar en cuanto se decide." },
    fix: { en: "Add a sticky Call or Book bar at the bottom of the screen on phones.", es: "Agregar una barra fija de Llamar o Reservar abajo en celulares." },
  }),
  d({
    id: "spanish", category: "conversion", weight: 0, service: "website", effort: "medium", source: "html",
    title: { en: "Spanish option (bonus)", es: "Opción en español (extra)" },
    whyItMatters: { en: "Many customers in our area prefer Spanish; offering it wins business competitors miss. Not scored.", es: "Muchos clientes de la zona prefieren español; ofrecerlo gana clientes que otros pierden. No afecta la puntuación." },
    fix: { en: "Add a Spanish version of the key pages.", es: "Agregar una versión en español de las páginas principales." },
  }),

  // ───────────── SEO and tracking (25) ─────────────
  d({
    id: "title", category: "seo", weight: 3, service: "website", effort: "quick", source: "html",
    title: { en: "Page title", es: "Título de la página" },
    whyItMatters: { en: "The title is the blue headline people click on in Google; it should say what you do and where.", es: "El título es el encabezado azul que se ve en Google; debe decir qué hace y dónde." },
    fix: { en: "Write a 30–60 character title with your service and city, e.g. 'Furnace Repair in Naperville | Name'.", es: "Escribir un título de 30–60 caracteres con su servicio y ciudad." },
  }),
  d({
    id: "meta-description", category: "seo", weight: 2, service: "website", effort: "quick", source: "html",
    title: { en: "Search description", es: "Descripción para buscadores" },
    whyItMatters: { en: "This is the short blurb under your name in Google; a good one gets more clicks.", es: "Es el texto corto bajo su nombre en Google; uno bueno atrae más clics." },
    fix: { en: "Write a 70–160 character description that sells your business.", es: "Escribir una descripción de 70–160 caracteres que venda su negocio." },
  }),
  d({
    id: "h1", category: "seo", weight: 2, service: "website", effort: "quick", source: "html",
    title: { en: "One main headline", es: "Un solo titular principal" },
    whyItMatters: { en: "Google uses the main headline to understand what the page is about.", es: "Google usa el titular principal para entender de qué trata la página." },
    fix: { en: "Use exactly one main headline that names your service and area.", es: "Usar un solo titular principal con su servicio y zona." },
  }),
  d({
    id: "schema", category: "seo", weight: 3, service: "website", effort: "quick", source: "html",
    title: { en: "Business info for Google (schema)", es: "Datos del negocio para Google (schema)" },
    whyItMatters: { en: "Hidden business details (name, address, phone) help Google show you in local results and the map.", es: "Los datos ocultos del negocio ayudan a Google a mostrarle en el mapa y resultados locales." },
    fix: { en: "Add LocalBusiness schema with your name, address, phone and hours.", es: "Agregar schema LocalBusiness con nombre, dirección, teléfono y horario." },
  }),
  d({
    id: "open-graph", category: "seo", weight: 1.5, service: "website", effort: "quick", source: "html",
    title: { en: "Link preview when shared or texted", es: "Vista previa al compartir o enviar por texto" },
    whyItMatters: { en: "When someone texts your link, a photo and title make it look trustworthy and get it opened.", es: "Cuando alguien comparte su enlace, una foto y título lo hacen confiable." },
    fix: { en: "Add Open Graph tags: title, description and a good photo.", es: "Agregar etiquetas Open Graph: título, descripción y una buena foto." },
  }),
  d({
    id: "canonical", category: "seo", weight: 1, service: "website", effort: "quick", source: "html",
    title: { en: "Canonical tag", es: "Etiqueta canónica" },
    whyItMatters: { en: "It tells Google which version of a page is the real one, so your ranking isn't split.", es: "Le dice a Google cuál es la versión oficial de la página para no dividir su posicionamiento." },
    fix: { en: "Add a canonical tag to each page.", es: "Agregar una etiqueta canónica a cada página." },
  }),
  d({
    id: "robots", category: "seo", weight: 1, service: "website", effort: "quick", source: "network",
    title: { en: "robots.txt file", es: "Archivo robots.txt" },
    whyItMatters: { en: "This file guides Google through your site; a bad one can hide you from search.", es: "Este archivo guía a Google por su sitio; uno mal hecho puede ocultarle." },
    fix: { en: "Add a robots.txt that allows Google and points to your sitemap.", es: "Agregar un robots.txt que permita a Google y apunte al mapa del sitio." },
  }),
  d({
    id: "sitemap", category: "seo", weight: 1, service: "website", effort: "quick", source: "network",
    title: { en: "Sitemap", es: "Mapa del sitio" },
    whyItMatters: { en: "A sitemap helps Google find every page, like a table of contents.", es: "El mapa del sitio ayuda a Google a encontrar cada página." },
    fix: { en: "Publish a sitemap.xml and submit it to Google Search Console.", es: "Publicar un sitemap.xml y enviarlo a Google Search Console." },
  }),
  d({
    id: "alt-text", category: "seo", weight: 2, service: "website", effort: "quick", source: "html",
    title: { en: "Image descriptions (alt text)", es: "Descripciones de imágenes (alt)" },
    whyItMatters: { en: "Google can't see pictures; descriptions help your photos show up in search and help visually impaired visitors.", es: "Google no ve imágenes; las descripciones ayudan en búsquedas y a personas con discapacidad visual." },
    fix: { en: "Add a short description to every image.", es: "Agregar una descripción corta a cada imagen." },
  }),
  d({
    id: "analytics", category: "seo", weight: 3, service: "leads", effort: "quick", source: "html",
    title: { en: "Visitor tracking (analytics)", es: "Medición de visitas (analítica)" },
    whyItMatters: { en: "Without tracking you can't tell how many people visit or which ads bring calls.", es: "Sin medición no sabe cuántos visitan ni qué anuncios traen llamadas." },
    fix: { en: "Install Google Analytics 4 (and a Meta Pixel if you run Facebook/Instagram ads).", es: "Instalar Google Analytics 4 (y el Pixel de Meta si anuncia en Facebook/Instagram)." },
  }),
  d({
    id: "gbp-link", category: "seo", weight: 2, service: "gbp", effort: "quick", source: "html",
    title: { en: "Link to Google Business Profile / Maps", es: "Enlace a Google Business / Maps" },
    whyItMatters: { en: "Linking your site and Google listing ties them together and makes directions one tap away.", es: "Enlazar su sitio y su ficha de Google los conecta y da direcciones con un toque." },
    fix: { en: "Add a 'Find us on Google' / directions link and a map.", es: "Agregar un enlace de 'Encuéntrenos en Google' / cómo llegar y un mapa." },
  }),
  d({
    id: "nap", category: "seo", weight: 3.5, service: "gbp", effort: "quick", source: "google",
    title: { en: "Name, address, phone match Google", es: "Nombre, dirección y teléfono coinciden con Google" },
    whyItMatters: { en: "When your site and Google listing disagree, Google trusts you less and customers get confused.", es: "Si su sitio y su ficha de Google no coinciden, Google confía menos y los clientes se confunden." },
    fix: { en: "Make your name, address and phone identical on the site and Google listing.", es: "Igualar nombre, dirección y teléfono en el sitio y en Google." },
  }),

  // ───────────── Speed and mobile (25) ─────────────
  d({
    id: "perf-score", category: "speed", weight: 8, service: "website", effort: "big", source: "pagespeed",
    title: { en: "Google speed score (mobile)", es: "Puntuación de velocidad de Google (celular)" },
    whyItMatters: { en: "Slow sites lose visitors; over half leave if a page takes more than 3 seconds.", es: "Los sitios lentos pierden visitas; más de la mitad se va si tarda más de 3 segundos." },
    fix: { en: "Rebuild or optimize the site for speed: smaller images, fewer plug-ins, fast hosting.", es: "Reconstruir u optimizar el sitio: imágenes más ligeras, menos complementos, buen hosting." },
  }),
  d({
    id: "lcp", category: "speed", weight: 4, service: "website", effort: "medium", source: "pagespeed",
    title: { en: "Time until the main content appears", es: "Tiempo hasta ver el contenido principal" },
    whyItMatters: { en: "This is how long a visitor stares at a mostly blank screen.", es: "Es cuánto tiempo el visitante mira una pantalla casi vacía." },
    fix: { en: "Shrink the top image and load it first; aim for under 2.5 seconds.", es: "Reducir la imagen principal y cargarla primero; meta: menos de 2.5 segundos." },
  }),
  d({
    id: "cls", category: "speed", weight: 3, service: "website", effort: "medium", source: "pagespeed",
    title: { en: "Page jumping while loading", es: "La página salta al cargar" },
    whyItMatters: { en: "When things jump around, people tap the wrong thing and get frustrated.", es: "Cuando todo se mueve, la gente toca lo que no quería y se frustra." },
    fix: { en: "Reserve space for images, ads and banners so nothing shifts.", es: "Reservar espacio para imágenes y anuncios para que nada se mueva." },
  }),
  d({
    id: "tbt", category: "speed", weight: 3, service: "website", effort: "medium", source: "pagespeed",
    title: { en: "Page freezing while loading", es: "La página se congela al cargar" },
    whyItMatters: { en: "If the page freezes, taps on buttons don't work and visitors give up.", es: "Si la página se congela, los botones no responden y el visitante se va." },
    fix: { en: "Remove heavy scripts and unused plug-ins.", es: "Quitar scripts pesados y complementos que no se usan." },
  }),
  d({
    id: "viewport", category: "speed", weight: 3, service: "website", effort: "quick", source: "html",
    title: { en: "Fits phone screens", es: "Se adapta a pantallas de celular" },
    whyItMatters: { en: "Without this, phones show a tiny zoomed-out desktop page.", es: "Sin esto, el celular muestra la versión de computadora diminuta." },
    fix: { en: "Add the mobile viewport tag and a mobile-friendly layout.", es: "Agregar la etiqueta viewport y un diseño para celular." },
  }),
  d({
    id: "readable-text", category: "speed", weight: 2, service: "website", effort: "medium", source: "pagespeed",
    title: { en: "Text readable on phones", es: "Texto legible en celular" },
    whyItMatters: { en: "If people have to pinch and zoom to read, they leave.", es: "Si hay que hacer zoom para leer, la gente se va." },
    fix: { en: "Use at least 16px text on mobile.", es: "Usar texto de al menos 16px en celular." },
  }),
  d({
    id: "page-weight", category: "speed", weight: 1, service: "website", effort: "medium", source: "pagespeed",
    title: { en: "Total page size", es: "Tamaño total de la página" },
    whyItMatters: { en: "Heavy pages are slow on cell data and burn through customers' data plans.", es: "Las páginas pesadas son lentas con datos móviles." },
    fix: { en: "Keep the home page under 2 MB.", es: "Mantener la página principal por debajo de 2 MB." },
  }),
  d({
    id: "images-oversized", category: "speed", weight: 1, service: "website", effort: "quick", source: "pagespeed",
    title: { en: "Oversized images", es: "Imágenes demasiado pesadas" },
    whyItMatters: { en: "Photos straight off a camera can be 10× bigger than needed, slowing everything down.", es: "Las fotos sin optimizar pueden pesar 10 veces más de lo necesario." },
    fix: { en: "Resize and compress images (WebP format).", es: "Redimensionar y comprimir imágenes (formato WebP)." },
  }),

  // ───────────── Trust and security (10) ─────────────
  d({
    id: "https", category: "trust", weight: 3, service: "website", effort: "quick", source: "network",
    title: { en: "Secure connection (HTTPS)", es: "Conexión segura (HTTPS)" },
    whyItMatters: { en: "Without the padlock, browsers warn visitors 'Not secure' and many leave.", es: "Sin el candado, el navegador muestra 'No seguro' y muchos se van." },
    fix: { en: "Turn on a free SSL certificate.", es: "Activar un certificado SSL gratuito." },
  }),
  d({
    id: "http-redirect", category: "trust", weight: 2, service: "website", effort: "quick", source: "network",
    title: { en: "Insecure address forwards to secure", es: "La dirección insegura redirige a la segura" },
    whyItMatters: { en: "People who type your address without 'https' should still land on the secure site.", es: "Quien escribe su dirección sin 'https' debe llegar al sitio seguro." },
    fix: { en: "Redirect all http:// traffic to https://.", es: "Redirigir todo el tráfico http:// a https://." },
  }),
  d({
    id: "copyright", category: "trust", weight: 1.5, service: "website", effort: "quick", source: "html",
    title: { en: "Copyright year is current", es: "Año de copyright actualizado" },
    whyItMatters: { en: "An old year at the bottom makes the business look closed or neglected.", es: "Un año viejo al pie de página hace parecer que el negocio está cerrado o abandonado." },
    fix: { en: "Update the footer year (or make it update automatically).", es: "Actualizar el año del pie de página (o hacerlo automático)." },
  }),
  d({
    id: "privacy", category: "trust", weight: 1.5, service: "website", effort: "quick", source: "html",
    title: { en: "Privacy policy", es: "Política de privacidad" },
    whyItMatters: { en: "If you collect names and numbers, customers (and ad platforms) expect a privacy policy.", es: "Si recoge nombres y teléfonos, clientes y plataformas de anuncios esperan una política de privacidad." },
    fix: { en: "Add a privacy policy page and link it in the footer.", es: "Agregar una página de privacidad y enlazarla en el pie de página." },
  }),
  d({
    id: "favicon", category: "trust", weight: 0.5, service: "website", effort: "quick", source: "html",
    title: { en: "Site icon (favicon)", es: "Ícono del sitio (favicon)" },
    whyItMatters: { en: "The little logo in the browser tab makes the site look finished and professional.", es: "El pequeño logo en la pestaña hace ver el sitio terminado y profesional." },
    fix: { en: "Add your logo as the site icon.", es: "Agregar su logo como ícono del sitio." },
  }),
  d({
    id: "broken-links", category: "trust", weight: 1.5, service: "website", effort: "quick", source: "network",
    title: { en: "No broken links", es: "Sin enlaces rotos" },
    whyItMatters: { en: "Clicking a dead link makes visitors think the business isn't paying attention.", es: "Un enlace roto hace pensar que el negocio no está atento." },
    fix: { en: "Fix or remove the broken links.", es: "Arreglar o quitar los enlaces rotos." },
  }),

  // ───────────── Content (10) ─────────────
  d({
    id: "services-listed", category: "content", weight: 3, service: "website", effort: "medium", source: "html",
    title: { en: "Services or menu clearly listed", es: "Servicios o menú bien listados" },
    whyItMatters: { en: "Visitors (and Google) need to see exactly what you offer to pick you.", es: "Los visitantes (y Google) deben ver exactamente qué ofrece para elegirle." },
    fix: { en: "Give each main service (or the menu) its own clear section or page.", es: "Dar a cada servicio principal (o al menú) su propia sección o página." },
  }),
  d({
    id: "about", category: "content", weight: 2, service: "website", effort: "medium", source: "html",
    title: { en: "About section", es: "Sección 'Quiénes somos'" },
    whyItMatters: { en: "People hire people; a short story and photo of the owner builds trust.", es: "La gente contrata personas; una historia corta y foto del dueño generan confianza." },
    fix: { en: "Add an About section with your story, years in business and a team photo.", es: "Agregar una sección con su historia, años en el negocio y foto del equipo." },
  }),
  d({
    id: "photos", category: "content", weight: 3, service: "website", effort: "medium", source: "html",
    title: { en: "Real photos", es: "Fotos reales" },
    whyItMatters: { en: "Real photos of your work, food or shop prove you're legit better than any words.", es: "Fotos reales de su trabajo, comida o local demuestran que es confiable." },
    fix: { en: "Add 6+ real photos of your work, team and location.", es: "Agregar 6 o más fotos reales de su trabajo, equipo y local." },
  }),
  d({
    id: "footer-contact", category: "content", weight: 2, service: "website", effort: "quick", source: "html",
    title: { en: "Contact info in the footer", es: "Contacto en el pie de página" },
    whyItMatters: { en: "People scroll to the bottom looking for how to reach you.", es: "La gente baja hasta el final buscando cómo contactarle." },
    fix: { en: "Put phone, address and hours in the footer of every page.", es: "Poner teléfono, dirección y horario en el pie de cada página." },
  }),
];

export const CHECK_BY_ID: Record<string, CheckDef> = Object.fromEntries(
  CHECKS.map((c) => [c.id, c]),
);

export const SERVICE_NAMES: Record<string, Text> = {
  website: { en: "Website build or rebuild", es: "Creación o rediseño de sitio web" },
  gbp: { en: "Google Business Profile", es: "Perfil de Google Business" },
  reviews: { en: "Review engine", es: "Motor de reseñas" },
  leads: { en: "Lead form and Command Center", es: "Formulario de clientes y Command Center" },
  ordering: { en: "Online ordering setup", es: "Configuración de pedidos en línea" },
};

export const CATEGORY_NAMES: Record<Category, Text> = {
  conversion: { en: "Conversion", es: "Conversión" },
  seo: { en: "SEO and tracking", es: "SEO y medición" },
  speed: { en: "Speed and mobile", es: "Velocidad y celular" },
  trust: { en: "Trust", es: "Confianza" },
  content: { en: "Content", es: "Contenido" },
};
