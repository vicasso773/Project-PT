// Downloads pages the way a normal browser would.

export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const MAX_BYTES = 5 * 1024 * 1024; // ignore anything past 5 MB of HTML

export class ScanError extends Error {
  constructor(
    public code: "invalid-url" | "not-found" | "timeout" | "refused" | "blocked" | "http-error" | "unreachable",
    message: string,
  ) {
    super(message);
  }
}

/** Turn whatever was typed ("joespizza.com", "https://…") into a URL, and refuse private/internal addresses. */
export function normalizeUrl(input: string): URL {
  let s = input.trim();
  if (!s) throw new ScanError("invalid-url", "Please enter a website address.");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new ScanError("invalid-url", `"${input}" doesn't look like a website address.`);
  }
  const host = u.hostname.toLowerCase();
  if (
    !host.includes(".") ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) || // raw IPs: don't let the scanner be pointed at internal machines
    host.startsWith("[")
  ) {
    throw new ScanError("invalid-url", `"${input}" isn't a public website address.`);
  }
  u.hash = "";
  return u;
}

export interface FetchedPage {
  status: number;
  finalUrl: string;
  contentType: string;
  body: string;
  headers: Headers;
}

function describeNetworkError(err: unknown, url: string): ScanError {
  const e = err as { name?: string; message?: string; cause?: { code?: string } };
  const code = e?.cause?.code ?? "";
  if (e?.name === "TimeoutError" || e?.name === "AbortError")
    return new ScanError("timeout", `${url} didn't respond within 20 seconds. The site may be down or very slow.`);
  if (code === "ENOTFOUND" || code === "EAI_AGAIN")
    return new ScanError("not-found", `We couldn't find a website at ${url}. Check the spelling, or the domain may have expired.`);
  if (code === "UND_ERR_SOCKET" || /PROTOCOL_ERROR|other side closed/i.test(String(e?.message) + String((e?.cause as { message?: string })?.message)))
    return new ScanError("blocked", `${url} cut off our connection. The site appears to block automated scanners (real visitors are not affected).`);
  if (code === "ECONNREFUSED" || code === "ECONNRESET")
    return new ScanError("refused", `${url} refused the connection. The site appears to be down.`);
  return new ScanError("unreachable", `We couldn't reach ${url} (${code || e?.message || "network error"}).`);
}

export async function fetchPage(
  url: string,
  opts: { timeoutMs?: number; redirect?: RequestRedirect; method?: string } = {},
): Promise<FetchedPage> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      redirect: opts.redirect ?? "follow",
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (err) {
    throw describeNetworkError(err, url);
  }
  let body = "";
  if (opts.method !== "HEAD" && res.body) {
    // Read at most MAX_BYTES so a giant file can't stall the scan.
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (total < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.byteLength;
      }
    } finally {
      reader.cancel().catch(() => {});
    }
    body = new TextDecoder("utf-8").decode(Buffer.concat(chunks));
  }
  return {
    status: res.status,
    finalUrl: res.url || url,
    contentType: res.headers.get("content-type") ?? "",
    body,
    headers: res.headers,
  };
}

/** Fetch the home page. Tries https first, then http. Throws a friendly ScanError if the site is down. */
export async function fetchHomePage(input: URL): Promise<FetchedPage & { httpsWorks: boolean }> {
  const httpsUrl = new URL(input.toString());
  httpsUrl.protocol = "https:";
  let page: FetchedPage | null = null;
  let firstError: ScanError | null = null;
  try {
    page = await fetchPage(httpsUrl.toString());
  } catch (e) {
    firstError = e as ScanError;
  }
  if (!page && firstError?.code !== "not-found") {
    // Maybe the site only works on plain http.
    const httpUrl = new URL(input.toString());
    httpUrl.protocol = "http:";
    try {
      page = await fetchPage(httpUrl.toString());
    } catch {
      /* keep the first error */
    }
  }
  if (!page) throw firstError ?? new ScanError("unreachable", `We couldn't reach ${input.host}.`);

  if (page.status === 403 || page.status === 429 || page.status === 503) {
    const looksBlocked = page.status !== 503 || /cloudflare|captcha|access denied|attention required|are you a robot|sucuri|wordfence/i.test(page.body);
    throw new ScanError(
      "blocked",
      looksBlocked
        ? `${input.host} blocked our scanner (error ${page.status}). Many sites block automated visits; real customers are not affected.`
        : `${input.host} answered "temporarily unavailable" (error 503). It may be down right now, or blocking automated scanners.`,
    );
  }
  if (page.status >= 400)
    throw new ScanError("http-error", `${input.host} returned error ${page.status}, so the home page isn't loading correctly.`);

  return { ...page, httpsWorks: page.finalUrl.startsWith("https:") };
}

/** Does http://host forward to https? Returns "unknown" if we couldn't tell. */
export async function checkHttpRedirect(host: string): Promise<"https" | "none" | "unknown"> {
  try {
    let url = `http://${host}/`;
    for (let i = 0; i < 5; i++) {
      const res = await fetchPage(url, { redirect: "manual", timeoutMs: 10_000, method: "HEAD" });
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, url);
        if (next.protocol === "https:") return "https";
        url = next.toString();
        continue;
      }
      return res.status < 400 ? "none" : "unknown";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}
