# Precise Talons Site Scanner

Type in a local business's website and get a report you can hand the owner on your phone or iPad:

- A **score out of 100** in a big animated ring, and **colored bars** for Conversion, SEO and tracking, Speed and mobile, Trust and Content.
- **What's missing, what's broken and what could be added**, in plain English.
- **What we'd do about it**: every problem tied to a Precise Talons service.
- **Present mode** (full-screen slides), **Print / Save as PDF**, a **share link and QR code**, and an **English / Spanish** switch.
- Extras: **competitor compare**, **no-website mode** (Google listing only), **Save as lead** to Airtable, and **scan history**.

**Honesty rules built in:** if something can't be checked (the site blocks scanners, a timeout, a missing API key), it's marked **"Couldn't check"**, left out of the score, and explained on the report. It never counts as a fail. The missed-revenue estimate is off until you turn it on, and it only uses the numbers you type.

---

## Contents

1. [Run it on your computer](#1-run-it-on-your-computer)
2. [Get the API keys](#2-get-the-api-keys) (PageSpeed, Google Places, Airtable)
3. [Put it online with Vercel](#3-put-it-online-with-vercel)
4. [Using it](#4-using-it)
5. [How the score works](#5-how-the-score-works)
6. [Changing wording, weights or services](#6-changing-wording-weights-or-services)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Run it on your computer

You only need to do steps 1–3 once.

1. **Install Node.js.** Go to [nodejs.org](https://nodejs.org), download the **LTS** version (20 or newer) and install it like any app.
2. **Get the code.** On the GitHub page for this repository, click **Code → Download ZIP** and unzip it, or use GitHub Desktop to clone it.
3. **Open a terminal in that folder.**
   - **Mac:** open Terminal, type `cd ` (with a space), drag the folder onto the window, and press Enter.
   - **Windows:** open the folder, click the address bar, type `cmd` and press Enter.

   Then run:

   ```bash
   npm install
   npm run db:setup
   ```

   `npm install` downloads the building blocks (takes a minute or two). `npm run db:setup` creates the local database file that stores reports.

4. **Add your keys.** Make a copy of the file `.env.example` and name the copy `.env.local`. Open it in any text editor and paste in the keys you have (see [section 2](#2-get-the-api-keys)). **Every key is optional.** Anything missing just shows as "Couldn't check".

   > `.env.local` holds your secrets and is never uploaded to GitHub. Don't put keys in `.env` or `.env.example`.

5. **Start it:**

   ```bash
   npm run dev
   ```

   Open **http://localhost:3000** in your browser. Press `Ctrl + C` in the terminal to stop it.

**To try it on your iPad or phone** (same Wi-Fi as your computer): run `npm run dev -- -H 0.0.0.0`, find your computer's local IP address (Mac: System Settings → Wi-Fi → Details; Windows: `ipconfig`), and open `http://THAT-IP:3000` on the iPad.

### Command-line scan (optional)

To scan without the website, which is handy for testing:

```bash
npm run scan -- joesbarbershop.com anothersite.com
```

Add `--fresh` to skip the 1-hour cache, or `--no-psi` to skip the slow Google speed test. Results print in the terminal and are saved in the `scan-results/` folder.

---

## 2. Get the API keys

### Google PageSpeed Insights: `PAGESPEED_API_KEY` (free, recommended)

This powers the **Speed and mobile** checks. Without it, that whole category shows "Couldn't check".

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in with a Google account.
2. At the top, click the project picker → **New project**. Name it "Precise Talons Scanner" and create it.
3. Open **APIs & Services → Library**, search **PageSpeed Insights API**, and click **Enable**.
4. Open **APIs & Services → Credentials → Create credentials → API key**. Copy the key.
5. *(Recommended)* Click the key → **API restrictions → Restrict key** → tick **PageSpeed Insights API** (and **Places API (New)** if you'll use the next key) → Save.
6. In `.env.local`: `PAGESPEED_API_KEY=your-key-here`

It's free, with a generous daily limit (about 25,000 scans/day).

### Google Places: `GOOGLE_PLACES_API_KEY` (optional)

This adds the business's **Google rating, review count, hours and phone**, checks that the **name, address and phone match** between the site and Google, and powers **no-website mode**.

1. In the same Google Cloud project: **APIs & Services → Library**, search **Places API (New)**, and click **Enable**.
2. Places requires **billing**: **Billing → Link a billing account** and add a card. Google gives a monthly free allowance that easily covers a small team's scans. You can set a budget alert under **Billing → Budgets & alerts** for peace of mind.
3. Use the same API key as above (make sure Places API (New) is ticked in its restrictions), or create a second one.
4. In `.env.local`: `GOOGLE_PLACES_API_KEY=your-key-here`

**How it matches the right business:** the scanner only trusts a Google listing that links back to the same website. If it can't find one, it says "couldn't confidently match" instead of guessing.

### Airtable: `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE` (optional)

This adds a **Save as lead** button to every report.

1. **Make the table.** In Airtable, create a base (or use an existing one) and a table, e.g. **Leads**, with these columns, **spelled exactly like this**:

   | Column name     | Type suggestion   |
   |-----------------|-------------------|
   | `Business Name` | Single line text  |
   | `Website`       | URL               |
   | `Score`         | Number            |
   | `Top Problems`  | Long text         |
   | `Report Link`   | URL               |
   | `Scan Date`     | Date              |

2. **Make a token.** Go to [airtable.com/create/tokens](https://airtable.com/create/tokens) → **Create token**.
   - Name: "Site Scanner".
   - Scopes: add **`data.records:write`**.
   - Access: add your base.
   - Create, then copy the token (it starts with `pat`).
3. **Find the base ID.** Open the base in your browser; the address looks like `airtable.com/appXXXXXXXXXXXXXX/...`. The `app…` part is the base ID.
4. In `.env.local`:

   ```
   AIRTABLE_TOKEN=patXXXXXXXX
   AIRTABLE_BASE_ID=appXXXXXXXX
   AIRTABLE_TABLE=Leads
   ```

The button only appears when all three are set. Each report remembers it was saved, so you don't create duplicates; you can still "save again" on purpose.

### Password: `APP_PASSWORD` (optional, recommended once online)

Once the app is on the internet, anyone who finds its address could run scans or browse your history. Set `APP_PASSWORD` to require a password for the scanner, the history page and the lead button. Your browser will ask for a username and password: type anything as the username and this value as the password.

**Report links (`/r/…`) always stay open** so business owners can view the reports you share.

---

## 3. Put it online with Vercel

Vercel hosts the app for free on its Hobby plan. There's one extra step: Vercel can't keep a database file between visits, so saved reports go to **Turso** (free hosted SQLite) instead.

### Step A: create the Turso database (once)

1. Sign up at [turso.tech](https://turso.tech) (free).
2. In the dashboard, click **Create Database**. Name it `precise-talons` and choose a location in the US (an East / Ohio-Virginia region is closest to Vercel's default).
3. Open the database and copy its **URL** (it starts with `libsql://`).
4. Create a **token** for it (look for **Create Token** / **Generate Token**) and copy it.
5. Add both to your local `.env.local`:

   ```
   TURSO_DATABASE_URL=libsql://precise-talons-yourname.turso.io
   TURSO_AUTH_TOKEN=eyJ...
   ```

6. In the terminal, run:

   ```bash
   npm run db:turso
   ```

   This creates the tables in Turso. It's safe to run again; it skips what's already done. **Run it again whenever you update the app**, in case new tables or columns were added.

> While `TURSO_DATABASE_URL` is in `.env.local`, your local app also uses Turso. Comment those two lines out (put `#` in front) to go back to the local file.

### Step B: deploy

1. Put the code on GitHub (it already is if you're reading this there).
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and click **Add New → Project**. Pick this repository and click **Import**.
3. Before clicking Deploy, open **Environment Variables** and add each of these:

   | Name | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | from step A |
   | `TURSO_AUTH_TOKEN` | from step A |
   | `PAGESPEED_API_KEY` | your key |
   | `GOOGLE_PLACES_API_KEY` | optional |
   | `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE` | optional |
   | `APP_PASSWORD` | recommended |

4. Click **Deploy**. In a couple of minutes you'll get an address like `precise-talons-scanner.vercel.app`. Open it on your iPad and use **Share → Add to Home Screen** for an app-like icon.

**Updating later:** push changes to GitHub and Vercel redeploys automatically. If you add or change keys in Vercel, redeploy (**Deployments → … → Redeploy**) for them to take effect.

**Custom address** (e.g. `scan.precisetalons.com`): in Vercel go to **Project → Settings → Domains**. Share links and QR codes pick up the address automatically; if they ever look wrong, set `PUBLIC_BASE_URL=https://scan.precisetalons.com`.

**Scan time:** a full scan takes 20–70 seconds, mostly Google's speed test. The scan route allows up to 120 seconds, which Vercel's current plans support.

**Cloudflare later:** the app doesn't depend on anything Vercel-specific, and Turso works from Cloudflare too. Moving it is a separate project when you're ready.

---

## 4. Using it

- **Scan:** type the website (with or without `https://`) and tap **Scan website**. Scanning the same site again within an hour reuses the saved report instantly; tick **Force a fresh scan** to rescan.
- **Competitors:** open **Compare with competitors** and add up to 2 websites. They're scanned at the same time and shown side by side, with a "What they have that you don't" list.
- **No website:** switch to **No website** and type the business name and town (e.g. `Lupe's Tacos, Cicero`). This needs the Google Places key. **Double-check the address on the report** to make sure Google found the right business.
- **On the report:**
  - **Present:** full-screen slides; swipe, use the arrow keys or tap Next.
  - **Print / PDF:** choose "Save as PDF" in the print window.
  - **Share:** opens your phone's share menu; there's also a QR code near the bottom.
  - **EN / ES:** switches the whole report, and the link you share stays in that language.
- **Missed-revenue estimate:** off by default. Turn it on, enter monthly visitors, average job/ticket and the extra % who'd become customers. It shows the formula and labels the result **Estimate**.
- **History:** linked from the home page. It lists every scan, newest first, and is searchable by name or website.

---

## 5. How the score works

| Category | Points | What it asks |
|---|---|---|
| Conversion | 30 | Does the site turn visitors into calls and bookings? |
| SEO and tracking | 25 | Can people find them, and can they measure it? |
| Speed and mobile | 25 | Google PageSpeed mobile test + mobile setup |
| Trust | 10 | HTTPS, current copyright, privacy policy, icon, broken links |
| Content | 10 | Services/menu, About, real photos, footer contact |

- Inside a category, each check has a **weight**. **Pass** earns all of it, **warn** earns half, **fail** earns none.
- **Couldn't check** items are left out, and the category is scored on what could be checked.
- If less than 40% of a category could be checked, the whole category shows "Couldn't check" and the total is rescaled over the others, so one lonely check never speaks for a whole category.
- The **Spanish option** is shown as a bonus but never scored.
- **Labels:** 0–49 *Needs urgent work* (red), 50–74 *Needs work* (yellow), 75–89 *Good* (green), 90–100 *Excellent* (green).
- **Fix these first** = the 5 problems that lose the most points, nudged toward quick fixes.
- Every report has a **How we scored this** table listing every check, its weight and its source (page HTML, Google PageSpeed, Google listing, or site files/links).

**Sites built with Wix, Squarespace, GoDaddy and similar** are detected and noted on the report. If a site's raw page is nearly empty (built entirely with JavaScript), anything we couldn't read becomes "Couldn't check", and Google's PageSpeed data fills in where it can (analytics, title, mobile setup).

**Sites that block scanners:** some web hosts refuse automated visitors. The scanner doesn't try to sneak past that. With a PageSpeed key it builds a partial report from Google's own visit and labels it clearly; otherwise it tells you the site blocked the scan.

---

## 6. Changing wording, weights or services

All of this lives in plain files you can edit:

| What | File |
|---|---|
| Each check's title, "why it matters", fix, weight, effort and service (English + Spanish) | `src/lib/scanner/definitions.ts` |
| Screen labels, service pitches, status words (English + Spanish) | `src/lib/i18n.ts` |
| How each check decides pass / warn / fail | `src/lib/scanner/checks/*.ts` |
| No-website mode checks | `src/lib/scanner/placesMode.ts` |
| Score labels and colors, "Fix these first" logic | `src/lib/scanner/score.ts` |
| Brand colors | `src/app/globals.css` (top of the file) |

The Spanish was written by Claude. Have a native speaker skim `definitions.ts` and `i18n.ts` before showing it to Spanish-speaking owners.

---

## 7. Troubleshooting

| Problem | What to do |
|---|---|
| Speed and mobile always says "Couldn't check" | Add `PAGESPEED_API_KEY`. The free no-key allowance is shared worldwide and often used up. |
| "blocked our scanner" / "cut off our connection" | The site's host refuses automated visits. Real customers aren't affected. With a PageSpeed key you'll get a partial report. |
| "didn't respond within 20 seconds" | The site is down or extremely slow. Try again later; this is worth mentioning to the owner. |
| "Name, address, phone match Google: Couldn't check" | Add `GOOGLE_PLACES_API_KEY`, or Google's listing doesn't link to this website. |
| "Too many scans" | Limit is 6 scans a minute and 60 an hour per device. Wait the number of seconds shown. |
| Airtable "missing a column" | A column name in your table doesn't match the list in section 2 exactly. |
| Reports disappear on Vercel | `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` aren't set in Vercel, or you skipped `npm run db:turso`. |
| Something's off with the form check, sticky button or photos | These are best-effort reads of the page's code. Forms or buttons added by scripts may be missed; the report says "worth a quick check" when unsure. |

### For developers

Next.js 15 (App Router) + TypeScript + Tailwind CSS 4, cheerio for HTML parsing, Prisma 6 with SQLite locally and Turso (libSQL adapter) in production. Scanning runs only server-side (`src/app/api/scan/route.ts` → `src/lib/scanner`). Useful commands: `npm run typecheck`, `npm run lint`, `npm run build`.
