import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { createServerClient } from "@/lib/supabase-server";
import { buildReports, reportHtml, reportPeriod, reportSubject, reportText } from "@/lib/monthlyReport";
import { alreadySent, recipients, reportsEnabled, sendTestReport } from "@/lib/sendReports";

export const maxDuration = 30;

// Panel admin → pestaña Reportes: ver números, vista previa, prueba a su correo y texto para WhatsApp
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { action, slug, mes } = await req.json().catch(() => ({}));
  const period = reportPeriod(typeof mes === "string" ? mes : null);
  const reports = await buildReports(period);

  if (action === "list") {
    return NextResponse.json({
      period: period.label,
      enabled: reportsEnabled(),
      sent: await alreadySent(period),
      recipients: recipients(reports).length,
      reports: reports
        .sort((a, b) => b.contacts - a.contacts || b.totalViews - a.totalViews)
        .map(({ id, name, slug, email, whatsapp, tier, optedOut, contacts, totalViews, reviewCount, missing }) => ({
          id,
          name,
          slug,
          hasEmail: Boolean(email),
          whatsapp,
          tier,
          optedOut,
          contacts,
          totalViews,
          reviewCount,
          missing: missing.length,
        })),
    });
  }

  const report = reports.find((r) => r.slug === slug);
  if (!report) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

  if (action === "preview") {
    return NextResponse.json({ subject: reportSubject(report, period), html: reportHtml(report, period), text: reportText(report, period) });
  }

  if (action === "test") {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const { data } = await createServerClient().auth.getUser(token);
    if (!data.user?.email) return NextResponse.json({ error: "Sin correo de admin" }, { status: 400 });
    try {
      await sendTestReport(report, period, data.user.email);
      return NextResponse.json({ ok: true, to: data.user.email });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
