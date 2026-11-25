import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCompetitors, loadReport } from "@/lib/db";
import { baseUrl, parseLang, qrSvg, reportPath } from "@/lib/share";
import { ReportView } from "@/components/report/ReportView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await loadReport((await params).id);
  if (!row) return { title: "Report not found" };
  return {
    title: `${row.businessName}: ${row.score ?? "—"}/100 | Precise Talons`,
    description: `Website report for ${row.businessName}, by Precise Talons.`,
    robots: { index: false }, // reports are private-by-link
  };
}

export default async function ReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const lang = parseLang((await searchParams).lang);
  const row = await loadReport(id);
  if (!row) notFound();
  const shareUrl = (await baseUrl()) + reportPath(id, lang);
  return <ReportView report={row.data} id={row.id} lang={lang} shareUrl={shareUrl} qr={await qrSvg(shareUrl)} competitors={await loadCompetitors(row.data)} />;
}
