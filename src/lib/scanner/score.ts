import { CATEGORY_POINTS } from "./definitions";
import type { Category, CategoryScore, CheckResult, ScoreLabel, Status } from "./types";

const VALUE: Record<Exclude<Status, "na">, number> = { pass: 1, warn: 0.5, fail: 0 };

const MIN_COVERAGE = 0.4;

export const CATEGORIES: Category[] = ["conversion", "seo", "speed", "trust", "content"];

/**
 * Weighted score out of 100.
 * - Each category is worth its points (30/25/25/10/10).
 * - Inside a category, each check earns weight × (pass 1, warn ½, fail 0).
 * - "Couldn't check" items are removed and the category is rescaled from what we could check.
 * - If less than 40% of a category's points could be checked, the category shows "Couldn't check"
 *   (one lonely check shouldn't speak for the whole category) and the total is rescaled over the others.
 */
export function computeScore(checks: CheckResult[]): {
  score: number | null;
  label: ScoreLabel | null;
  categories: CategoryScore[];
} {
  const categories: CategoryScore[] = CATEGORIES.map((category) => {
    const inCat = checks.filter((c) => c.category === category && c.weight > 0);
    const scored = inCat.filter((c) => c.status !== "na");
    const possible = scored.reduce((s, c) => s + c.weight, 0);
    const earned = scored.reduce((s, c) => s + c.weight * VALUE[c.status as Exclude<Status, "na">], 0);
    const total = inCat.reduce((s, c) => s + c.weight, 0);
    const enough = possible > 0 && possible >= total * MIN_COVERAGE;
    return {
      category,
      max: CATEGORY_POINTS[category],
      percent: enough ? Math.round((earned / possible) * 100) : null,
      checked: scored.length,
      skipped: inCat.length - scored.length,
    };
  });

  const usable = categories.filter((c) => c.percent !== null);
  const maxPoints = usable.reduce((s, c) => s + c.max, 0);
  if (!maxPoints) return { score: null, label: null, categories };
  const points = usable.reduce((s, c) => s + (c.max * (c.percent as number)) / 100, 0);
  const score = Math.round((points / maxPoints) * 100);
  return { score, label: labelFor(score), categories };
}

export function labelFor(score: number): ScoreLabel {
  if (score < 50) return "urgent";
  if (score < 75) return "needsWork";
  if (score < 90) return "good";
  return "excellent";
}

export const LABEL_TEXT: Record<ScoreLabel, { en: string; es: string; color: "red" | "yellow" | "green" }> = {
  urgent: { en: "Needs urgent work", es: "Necesita trabajo urgente", color: "red" },
  needsWork: { en: "Needs work", es: "Necesita mejoras", color: "yellow" },
  good: { en: "Good", es: "Bueno", color: "green" },
  excellent: { en: "Excellent", es: "Excelente", color: "green" },
};

const EASE = { quick: 1, medium: 0.8, big: 0.6 } as const;

/** Points lost by a check (what fixing it would win back). */
export const pointsLost = (c: CheckResult) =>
  c.status === "na" ? 0 : c.weight * (1 - VALUE[c.status as Exclude<Status, "na">]);

/** "Fix these first": biggest point losses, nudged toward quick wins. */
export function fixFirst(checks: CheckResult[], n = 5): CheckResult[] {
  return checks
    .filter((c) => (c.status === "fail" || c.status === "warn") && c.weight > 0)
    .sort((a, b) => pointsLost(b) * EASE[b.effort] - pointsLost(a) * EASE[a.effort])
    .slice(0, n);
}
