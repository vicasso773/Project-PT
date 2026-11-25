// Basic rate limiting: each visitor (by IP) gets a few scans per minute and per hour.
// Kept in memory, so it resets when the server restarts. Fine for a small team.

const hits = new Map<string, number[]>();

const LIMITS = [
  { windowMs: 60_000, max: 6 }, // 6 scans per minute
  { windowMs: 60 * 60_000, max: 60 }, // 60 scans per hour
];

/** Returns null if allowed, or the number of seconds to wait. */
export function rateLimit(key: string, cost = 1): number | null {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < 60 * 60_000);
  for (const { windowMs, max } of LIMITS) {
    const inWindow = list.filter((t) => now - t < windowMs);
    if (inWindow.length + cost > max) {
      const oldest = inWindow[0] ?? now;
      return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    }
  }
  for (let i = 0; i < cost; i++) list.push(now);
  hits.set(key, list);
  return null;
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "local";
}
