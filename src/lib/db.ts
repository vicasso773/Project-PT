import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import type { ScanReport } from "./scanner/types";

// One shared database connection (Next.js reloads code in development).
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

/** Short, unguessable id for share links, e.g. "k3x9q2mwp7". */
export function newId(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

export async function saveReport(report: ScanReport, opts: { kind?: "site" | "places"; parentId?: string } = {}) {
  const id = newId();
  await prisma.scan.create({
    data: {
      id,
      url: report.finalUrl,
      host: opts.kind === "places" ? `places:${report.businessName.toLowerCase()}` : hostOf(report.finalUrl),
      businessName: report.businessName,
      score: report.score,
      label: report.label,
      kind: opts.kind ?? "site",
      parentId: opts.parentId ?? null,
      report: JSON.stringify(report),
    },
  });
  return id;
}

export async function loadReport(id: string) {
  const row = await prisma.scan.findUnique({ where: { id } });
  if (!row) return null;
  return { ...row, data: JSON.parse(row.report) as ScanReport };
}

/** A scan of the same site from the last hour, if any (the 1-hour cache). */
export async function recentScan(host: string) {
  return prisma.scan.findFirst({
    where: { host, kind: "site", createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
}
