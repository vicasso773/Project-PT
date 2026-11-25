import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCompetitors, loadReport } from "@/lib/db";
import { baseUrl, parseLang, qrSvg, reportPath } from "@/lib/share";
import { PresentView } from "@/components/report/PresentView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Present | Precise Talons", robots: { index: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };

export default async function PresentPage({ params, searchParams }: Props) {
  const { id } = await params;
  const lang = parseLang((await searchParams).lang);
  const row = await loadReport(id);
  if (!row) notFound();
  const shareUrl = (await baseUrl()) + reportPath(id, lang);
  return <PresentView report={row.data} id={id} lang={lang} shareUrl={shareUrl} qr={await qrSvg(shareUrl)} competitors={await loadCompetitors(row.data)} />;
}
