import { NextRequest, NextResponse } from "next/server";
import { reportPeriod, buildReports } from "@/lib/monthlyReport";
import { recipients, reportsEnabled, sendMonthlyReports } from "@/lib/sendReports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lo llama Vercel Cron el día 1 de cada mes (ver vercel.json) con "Authorization: Bearer CRON_SECRET".
// Mientras MONTHLY_REPORTS_ENABLED no sea "true" solo informa a quién se le enviaría.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const period = reportPeriod(req.nextUrl.searchParams.get("mes"));

  if (!reportsEnabled()) {
    const list = recipients(await buildReports(period));
    return NextResponse.json({ enabled: false, period: period.label, wouldSend: list.length });
  }

  try {
    const result = await sendMonthlyReports(period);
    return NextResponse.json({ enabled: true, period: period.label, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
