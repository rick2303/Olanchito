import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase-server";
import { buildReports, reportHtml, reportSubject, type BusinessReport, type ReportPeriod } from "@/lib/monthlyReport";
import { unsubscribeUrl } from "@/lib/updateLink";

const FROM = "Directorio Olanchito <info@olanchito.com>";
// Marca en correction_suggestions para no mandar dos veces el mismo mes (el cron puede reintentar)
export const REPORT_SENT_FIELD = "reporte_enviado";
const REPORT_SENT_SLUG = "__reporte__";

export function reportsEnabled(): boolean {
  return process.env.MONTHLY_REPORTS_ENABLED === "true";
}

export function recipients(reports: BusinessReport[]): BusinessReport[] {
  return reports.filter((r) => r.email && !r.optedOut);
}

function emailFor(r: BusinessReport, period: ReportPeriod, to?: string) {
  return {
    from: FROM,
    to: to ?? r.email!,
    subject: reportSubject(r, period),
    html: reportHtml(r, period),
    headers: { "List-Unsubscribe": `<${unsubscribeUrl(r.slug)}>` },
  };
}

export async function alreadySent(period: ReportPeriod): Promise<boolean> {
  const { data } = await createServerClient()
    .from("correction_suggestions")
    .select("id")
    .eq("field", REPORT_SENT_FIELD)
    .eq("business_name", period.label)
    .limit(1);
  return (data ?? []).length > 0;
}

export async function sendMonthlyReports(period: ReportPeriod): Promise<{ sent: number; skipped: string }> {
  if (await alreadySent(period)) return { sent: 0, skipped: `El reporte de ${period.label} ya se envió` };

  const list = recipients(await buildReports(period));
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Resend acepta hasta 100 correos por lote
  let sent = 0;
  for (let i = 0; i < list.length; i += 100) {
    const batch = list.slice(i, i + 100).map((r) => emailFor(r, period));
    const { error } = await resend.batch.send(batch);
    if (error) throw new Error(`Resend: ${error.message}`);
    sent += batch.length;
  }

  await createServerClient().from("correction_suggestions").insert({
    business_slug: REPORT_SENT_SLUG,
    business_name: period.label,
    field: REPORT_SENT_FIELD,
    description: `Reporte mensual enviado a ${sent} negocios`,
  });

  return { sent, skipped: "" };
}

// Prueba: manda el reporte de un negocio al correo del admin, sin tocar al dueño
export async function sendTestReport(r: BusinessReport, period: ReportPeriod, to: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const email = emailFor(r, period, to);
  const { error } = await resend.emails.send({ ...email, subject: `[Prueba] ${email.subject}` });
  if (error) throw new Error(`Resend: ${error.message}`);
}
