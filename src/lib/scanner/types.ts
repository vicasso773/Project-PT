// Shared shapes used by the scanner, the report screen and the database.

export type Lang = "en" | "es";
/** A piece of text in both languages. */
export type Text = { en: string; es: string };

export type Category = "conversion" | "seo" | "speed" | "trust" | "content";

/** "na" = Couldn't check. It never counts as a fail and is left out of the score. */
export type Status = "pass" | "warn" | "fail" | "na";

export type Service = "website" | "gbp" | "reviews" | "leads" | "ordering";

export type Effort = "quick" | "medium" | "big";

/** Where the data for a check came from (shown in "How we scored this"). */
export type Source = "html" | "pagespeed" | "google" | "network";

export interface CheckResult {
  id: string;
  category: Category;
  /** Points this check is worth inside its category. 0 = shown but not scored. */
  weight: number;
  status: Status;
  title: Text;
  found: Text;
  whyItMatters: Text;
  fix: Text;
  service: Service;
  effort: Effort;
  source: Source;
}

export interface CategoryScore {
  category: Category;
  /** Max points for the category (30/25/25/10/10). */
  max: number;
  /** 0–100 inside this category, or null if nothing in it could be checked. */
  percent: number | null;
  checked: number;
  skipped: number;
}

export interface PlacesInfo {
  name: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  hours?: string[];
  mapsUrl?: string;
  website?: string;
  /** true when Google's listing links to the same website we scanned. */
  matchedWebsite: boolean;
}

export interface ScanReport {
  version: 1;
  inputUrl: string;
  finalUrl: string;
  businessName: string;
  scannedAt: string; // ISO date
  score: number | null; // 0–100, null if nothing could be checked
  label: ScoreLabel | null;
  categories: CategoryScore[];
  checks: CheckResult[];
  platform: string | null; // "Wix", "Squarespace", …
  notes: Text[]; // honest notes: "PageSpeed unavailable", "Built on Wix", …
  places: PlacesInfo | null;
  sources: { pagespeed: boolean; places: boolean; renderedFallback: boolean };
  /** Competitor scans attached to this report (ids point at their own saved reports). */
  compare?: CompareEntry[];
}

export interface CompareEntry {
  input: string;
  id?: string;
  error?: string;
}

export type ScoreLabel = "urgent" | "needsWork" | "good" | "excellent";
