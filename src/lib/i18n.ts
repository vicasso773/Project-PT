// Every piece of report-screen text, in English and Spanish.

import type { Lang, Service, Text } from "./scanner/types";

export const UI = {
  scannedOn: { en: "Scanned", es: "Revisado el" },
  outOf: { en: "out of 100", es: "de 100" },
  categories: { en: "How the site scores", es: "Cómo califica el sitio" },
  couldntCheck: { en: "Couldn't check", es: "No se pudo revisar" },
  fixFirst: { en: "Fix these first", es: "Arreglar primero" },
  fixFirstSub: { en: "The biggest wins, weighted toward the easiest fixes.", es: "Lo que más ayuda, priorizando lo más fácil de arreglar." },
  allChecks: { en: "Every check", es: "Todas las revisiones" },
  whatWeDo: { en: "What we'd do", es: "Lo que haríamos" },
  whatWeDoSub: { en: "Every problem we found, grouped by the Precise Talons service that fixes it.", es: "Cada problema encontrado, agrupado por el servicio de Precise Talons que lo resuelve." },
  howScored: { en: "How we scored this", es: "Cómo calculamos esto" },
  found: { en: "What we found", es: "Lo que encontramos" },
  why: { en: "Why it matters", es: "Por qué importa" },
  fix: { en: "The fix", es: "La solución" },
  effort: { en: "Effort", es: "Esfuerzo" },
  pts: { en: "pts", es: "pts" },
  notScored: { en: "not scored", es: "no cuenta" },
  source: { en: "Source", es: "Fuente" },
  weight: { en: "Weight", es: "Peso" },
  status: { en: "Result", es: "Resultado" },
  check: { en: "Check", es: "Revisión" },
  noProblems: { en: "Nothing to fix here. Nice work.", es: "Nada que arreglar aquí. ¡Buen trabajo!" },
  copyLink: { en: "Copy link", es: "Copiar enlace" },
  copied: { en: "Copied!", es: "¡Copiado!" },
  newScan: { en: "New scan", es: "Nuevo escaneo" },
  googleListing: { en: "Google listing", es: "Ficha de Google" },
  reviews: { en: "reviews", es: "reseñas" },
  notes: { en: "Notes about this scan", es: "Notas sobre este escaneo" },
  passed: { en: "passed", es: "aprobadas" },
  issues: { en: "to fix", es: "por arreglar" },
  revenueTitle: { en: "Missed-revenue estimate", es: "Estimación de ingresos perdidos" },
  revenueOff: { en: "Off. Turn on to enter your own numbers.", es: "Apagado. Actívelo para ingresar sus propios números." },
  revenueTurnOn: { en: "Turn on", es: "Activar" },
  revenueTurnOff: { en: "Turn off", es: "Apagar" },
  revenueVisitors: { en: "Monthly website visitors", es: "Visitantes al mes" },
  revenueTicket: { en: "Average job / ticket ($)", es: "Venta promedio ($)" },
  revenueRate: { en: "Extra visitors who'd become customers (%)", es: "Visitantes extra que se volverían clientes (%)" },
  revenueEstimate: { en: "Estimate", es: "Estimación" },
  revenuePerMonth: { en: "per month", es: "al mes" },
  revenueExplain: {
    en: "Uses only the numbers entered above. Nothing is pulled from the scan or made up.",
    es: "Usa solo los números ingresados arriba. Nada se toma del escaneo ni se inventa.",
  },
  revenueNeed: { en: "Enter all three numbers to see the estimate.", es: "Ingrese los tres números para ver la estimación." },
  present: { en: "Present", es: "Presentar" },
  print: { en: "Print / PDF", es: "Imprimir / PDF" },
  share: { en: "Share this report", es: "Compartir este reporte" },
  shareSub: { en: "Scan the code to open this report on your phone.", es: "Escanee el código para abrir este reporte en su celular." },
  exit: { en: "Exit", es: "Salir" },
  fullscreen: { en: "Full screen", es: "Pantalla completa" },
  next: { en: "Next", es: "Siguiente" },
  prev: { en: "Back", es: "Atrás" },
  swipeHint: { en: "Swipe to continue", es: "Deslice para continuar" },
  letsFix: { en: "Let's fix this together.", es: "Arreglemos esto juntos." },
  closingSub: {
    en: "Precise Talons builds websites, Google Business Profiles and lead automation for local businesses.",
    es: "Precise Talons crea sitios web, perfiles de Google Business y automatización de clientes para negocios locales.",
  },
  preparedBy: { en: "Prepared by Precise Talons", es: "Preparado por Precise Talons" },
  scoreTitle: { en: "Website score", es: "Puntuación del sitio" },
  scoreMethod: {
    en: "Each category is worth points: Conversion 30, SEO and tracking 25, Speed and mobile 25, Trust 10, Content 10. Inside a category, each check is worth its weight: pass earns all of it, warn earns half, fail earns none. Checks we couldn't run are left out and the category is scored on what we could check. If less than 40% of a category could be checked, the whole category is left out and the total is rescaled.",
    es: "Cada categoría vale puntos: Conversión 30, SEO y medición 25, Velocidad y celular 25, Confianza 10, Contenido 10. Dentro de cada categoría, cada revisión vale su peso: aprobada gana todo, advertencia la mitad, falla nada. Lo que no se pudo revisar no cuenta. Si se revisó menos del 40% de una categoría, se excluye y el total se recalcula.",
  },
} satisfies Record<string, Text>;

export const STATUS_TEXT: Record<string, Text> = {
  pass: { en: "Pass", es: "Bien" },
  warn: { en: "Could be better", es: "Puede mejorar" },
  fail: { en: "Missing / broken", es: "Falta / roto" },
  na: { en: "Couldn't check", es: "No se pudo revisar" },
};

export const EFFORT_TEXT: Record<string, Text> = {
  quick: { en: "Quick fix", es: "Arreglo rápido" },
  medium: { en: "Medium", es: "Mediano" },
  big: { en: "Bigger project", es: "Proyecto mayor" },
};

export const SOURCE_TEXT: Record<string, Text> = {
  html: { en: "Page HTML", es: "HTML de la página" },
  pagespeed: { en: "Google PageSpeed", es: "Google PageSpeed" },
  google: { en: "Google listing", es: "Ficha de Google" },
  network: { en: "Site files / links", es: "Archivos / enlaces del sitio" },
};

export const SERVICE_PITCH: Record<Service, Text> = {
  website: {
    en: "A fast, mobile-first site built to turn visitors into calls and bookings.",
    es: "Un sitio rápido, pensado para celular, que convierte visitas en llamadas y reservas.",
  },
  gbp: {
    en: "We set up and manage your Google listing so you show up on the map and it matches your site.",
    es: "Configuramos y administramos su ficha de Google para que aparezca en el mapa y coincida con su sitio.",
  },
  reviews: {
    en: "Automatic review requests after every job, with the best ones shown on your site.",
    es: "Solicitudes automáticas de reseñas después de cada trabajo, y las mejores en su sitio.",
  },
  leads: {
    en: "Forms and tracking that send every lead to your phone, with instant text-back and one place to see them all.",
    es: "Formularios y medición que mandan cada cliente a su celular, con respuesta automática y todo en un solo lugar.",
  },
  ordering: {
    en: "Online booking or ordering connected to your site and Google, so customers can buy at 2 a.m.",
    es: "Reservas o pedidos en línea conectados a su sitio y a Google, para que compren a cualquier hora.",
  },
};

export const tr = (t: Text, lang: Lang) => t[lang];
