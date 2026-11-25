// Command-line scanner.  Usage:  npm run scan -- superdawg.com air-rite.com [--fresh] [--no-psi]
// Results are printed and saved to scan-results/<host>.json

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { CATEGORY_NAMES, SERVICE_NAMES } from "../src/lib/scanner/definitions";
import { ScanError, runScan } from "../src/lib/scanner";
import { LABEL_TEXT, fixFirst } from "../src/lib/scanner/score";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = process.argv.slice(2);
const urls = args.filter((a) => !a.startsWith("--"));
const fresh = args.includes("--fresh");
const skipPageSpeed = args.includes("--no-psi");

const C = { red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m", gray: "\x1b[90m", bold: "\x1b[1m", reset: "\x1b[0m" };
const ICON = { pass: `${C.green}✔${C.reset}`, warn: `${C.yellow}!${C.reset}`, fail: `${C.red}✘${C.reset}`, na: `${C.gray}–${C.reset}` };

if (!urls.length) {
  console.log("Usage: npm run scan -- <website> [<website> …] [--fresh] [--no-psi]");
  process.exit(1);
}

mkdirSync("scan-results", { recursive: true });

for (const url of urls) {
  console.log(`\n${C.bold}━━━ Scanning ${url} ━━━${C.reset}`);
  const started = Date.now();
  try {
    const r = await runScan(url, { fresh, skipPageSpeed, log: (m) => console.log(`${C.gray}  ${m}${C.reset}`) });
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    const lt = r.label ? LABEL_TEXT[r.label] : null;
    const color = lt ? C[lt.color] : C.gray;
    console.log(`\n${C.bold}${r.businessName}${C.reset}  ${r.finalUrl}  ${C.gray}(${secs}s)${C.reset}`);
    console.log(`${C.bold}Score: ${color}${r.score ?? "n/a"}/100 ${lt ? "— " + lt.en : ""}${C.reset}\n`);

    for (const cat of r.categories) {
      const pct = cat.percent;
      const bar = pct === null ? "couldn't check" : "█".repeat(Math.round(pct / 5)).padEnd(20, "·") + ` ${pct}%`;
      const skipped = cat.skipped ? `${C.gray} (${cat.skipped} skipped)${C.reset}` : "";
      console.log(`  ${CATEGORY_NAMES[cat.category].en.padEnd(18)} ${bar}${skipped}`);
    }

    console.log(`\n${C.bold}Fix these first:${C.reset}`);
    fixFirst(r.checks).forEach((c, i) =>
      console.log(`  ${i + 1}. ${c.title.en} ${C.gray}[${c.effort}, → ${SERVICE_NAMES[c.service].en}]${C.reset}\n     ${c.found.en}`),
    );

    console.log(`\n${C.bold}All checks:${C.reset}`);
    let lastCat = "";
    for (const c of r.checks) {
      if (c.category !== lastCat) {
        console.log(`  ${C.bold}${CATEGORY_NAMES[c.category].en}${C.reset}`);
        lastCat = c.category;
      }
      console.log(`   ${ICON[c.status]} ${c.title.en.padEnd(46)} ${C.gray}${c.found.en}${C.reset}`);
    }

    if (r.notes.length) {
      console.log(`\n${C.bold}Notes:${C.reset}`);
      r.notes.forEach((n) => console.log(`  • ${n.en}`));
    }
    const file = `scan-results/${new URL(r.finalUrl).hostname}.json`;
    writeFileSync(file, JSON.stringify(r, null, 2));
    console.log(`${C.gray}\nSaved ${file}${C.reset}`);
  } catch (e) {
    if (e instanceof ScanError) console.log(`${C.red}✘ ${e.message}${C.reset}`);
    else console.log(`${C.red}✘ Unexpected error:${C.reset}`, e);
  }
}
