// Figures out what the site was built with, from tell-tale fingerprints in the HTML.

const FINGERPRINTS: [string, RegExp][] = [
  ["Wix", /static\.wixstatic\.com|wix\.com website builder|_wixCssImports|wixBiSession/i],
  ["Squarespace", /static1\.squarespace\.com|squarespace\.com|Squarespace-Headers/i],
  ["GoDaddy", /img1\.wsimg\.com|GoDaddy Website Builder|Go Daddy Website Builder|godaddysites\.com/i],
  ["Square Online", /editmysite\.com|square\.site|weebly\.com/i],
  ["Duda", /multiscreensite|dudaone|irp\.cdn-website\.com/i],
  ["Shopify", /cdn\.shopify\.com|Shopify\.theme/i],
  ["Webflow", /webflow\.(js|com)|data-wf-page/i],
  ["Toast site", /toasttab\.com\/[^"']*site|toast-sites/i],
  ["BentoBox", /getbento\.com|bentobox/i],
  ["WordPress", /wp-content\/|wp-includes\/|<meta name="generator" content="WordPress/i],
];

export function detectPlatform(html: string): string | null {
  for (const [name, re] of FINGERPRINTS) if (re.test(html)) return name;
  return null;
}

/** Builders that often render content with JavaScript. */
export const JS_HEAVY = new Set(["Wix", "Squarespace", "GoDaddy", "Duda", "Webflow", "Square Online"]);
