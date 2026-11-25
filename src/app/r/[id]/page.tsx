import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadReport } from "@/lib/db";
import { ReportView } from "@/components/report/ReportView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await loadReport((await params).id);
  if (!row) return { title: "Report not found" };
  return {
    title: `${row.businessName}: ${row.score ?? "—"}/100 | Precise Talons`,
    description: `Website report for ${row.businessName}, by Precise Talons.`,
    robots: { index: false }, // reports are private-by-link
  };
}

export default async function ReportPage({ params }: Props) {
  const row = await loadReport((await params).id);
  if (!row) notFound();
  return <ReportView report={row.data} id={row.id} />;
}
