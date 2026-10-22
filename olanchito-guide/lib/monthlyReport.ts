// Reporte mensual para cada dueño: cuántos clientes le contactaron, visitas, reseñas y
// qué le falta a su ficha. Es el argumento para que el dueño vea el valor del directorio
// (y del plan de pago) con sus propios números.
import { createServerClient } from "@/lib/supabase-server";
import { missingFields, MISSING_LABELS, REPORT_OPTOUT_FIELD, type MissingField } from "@/lib/businessFields";
import { baseUrl, unsubscribeUrl, updateUrl } from "@/lib/updateLink";

const TIME_ZONE = "America/Tegucigalpa";
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export type ReportPeriod = { year: number; month: number; label: string; start: Date; end: Date; prevStart: Date };

// Honduras es UTC-6 todo el año (sin horario de verano)
function hnMidnight(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1, 6, 0, 0));
}

// "2026-10" → octubre 2026. Sin parámetro: el mes anterior al actual en hora de Honduras.
export function reportPeriod(ym?: string | null, now = new Date()): ReportPeriod {
  let year: number;
  let month: number; // 0-11
  const m = ym?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    year = Number(m[1]);
    month = Number(m[2]) - 1;
  } else {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "numeric" }).formatToParts(now);
    year = Number(parts.find((p) => p.type === "year")?.value);
    month = Number(parts.find((p) => p.type === "month")?.value) - 2;
    if (month < 0) {
      month += 12;
      year -= 1;
    }
  }
  return {
    year,
    month,
    label: `${MONTHS[month]} ${year}`,
    start: hnMidnight(year, month),
    end: hnMidnight(year, month + 1),
    prevStart: hnMidnight(year, month - 1),
  };
}

export type BusinessReport = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  whatsapp: string | null;
  tier: "free" | "premium" | "featured";
  optedOut: boolean;
  whatsappClicks: number;
  phoneClicks: number;
  contacts: number;
  prevContacts: number;
  totalViews: number;
  newReviews: number;
  reviewCount: number;
  avgRating: number | null;
  categoryName: string | null;
  categoryRank: number | null;
  categorySize: number;
  missing: MissingField[];
};

export async function buildReports(period: ReportPeriod): Promise<BusinessReport[]> {
  const supabase = createServerClient();
  const [{ data: businesses }, { data: categories }, { data: events }, { data: reviews }, { data: optOuts }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug, owner_email, whatsapp, phone, image, view_count, category_id, subscription_tier, subscription_active, location, hours, description, services"),
    supabase.from("categories").select("id, name"),
    supabase
      .from("business_events")
      .select("business_id, event_type, created_at")
      .gte("created_at", period.prevStart.toISOString())
      .lt("created_at", period.end.toISOString()),
    supabase.from("reviews").select("business_slug, rating, created_at").eq("is_visible", true),
    supabase.from("correction_suggestions").select("business_slug").eq("field", REPORT_OPTOUT_FIELD),
  ]);

  const optedOut = new Set((optOuts ?? []).map((o) => o.business_slug));
  const categoryName = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const all = businesses ?? [];

  return all.map((b) => {
    const mine = (events ?? []).filter((e) => e.business_id === b.id);
    const inMonth = mine.filter((e) => new Date(e.created_at) >= period.start);
    const prev = mine.filter((e) => new Date(e.created_at) < period.start);
    const whatsappClicks = inMonth.filter((e) => e.event_type === "whatsapp_click").length;
    const phoneClicks = inMonth.filter((e) => e.event_type === "phone_click").length;

    const myReviews = (reviews ?? []).filter((r) => r.business_slug === b.slug);
    const newReviews = myReviews.filter((r) => {
      const d = new Date(r.created_at);
      return d >= period.start && d < period.end;
    }).length;

    const sameCategory = all
      .filter((x) => x.category_id && x.category_id === b.category_id)
      .sort((x, y) => (y.view_count ?? 0) - (x.view_count ?? 0));
    const rank = sameCategory.findIndex((x) => x.id === b.id);
    const catName = b.category_id ? categoryName.get(b.category_id) ?? null : null;

    const tier = b.subscription_active && (b.subscription_tier === "premium" || b.subscription_tier === "featured") ? b.subscription_tier : "free";

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      email: b.owner_email,
      whatsapp: b.whatsapp || b.phone,
      tier,
      optedOut: optedOut.has(b.slug),
      whatsappClicks,
      phoneClicks,
      contacts: whatsappClicks + phoneClicks,
      prevContacts: prev.length,
      totalViews: b.view_count ?? 0,
      newReviews,
      reviewCount: myReviews.length,
      avgRating: myReviews.length ? myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length : null,
      categoryName: catName,
      // "La #2 en Otros" no le dice nada al dueño
      categoryRank: rank >= 0 && sameCategory.length > 1 && catName !== "Otros" ? rank + 1 : null,
      categorySize: sameCategory.length,
      missing: missingFields(b),
    } satisfies BusinessReport;
  });
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function reportSubject(r: BusinessReport, period: ReportPeriod): string {
  if (r.contacts > 0) {
    return `${r.name}: ${r.contacts} cliente${r.contacts !== 1 ? "s" : ""} le contact${r.contacts !== 1 ? "aron" : "ó"} en ${MONTHS[period.month]}`;
  }
  return `${r.name}: su resumen de ${MONTHS[period.month]} en olanchito.com`;
}

function trendText(r: BusinessReport): string {
  if (r.prevContacts === 0 && r.contacts === 0) return "";
  if (r.prevContacts === 0) return "Primer mes con contactos registrados.";
  const diff = r.contacts - r.prevContacts;
  if (diff === 0) return "Igual que el mes anterior.";
  return diff > 0 ? `${diff} más que el mes anterior.` : `${-diff} menos que el mes anterior.`;
}

function upsell(r: BusinessReport): { title: string; body: string; cta: string } | null {
  if (r.tier === "free") {
    return {
      title: "¿Quiere que le contacten más clientes?",
      body: "Con el plan Premium su ficha muestra galería de fotos, catálogo de productos y enlace para agendar citas, y usted ve sus estadísticas en el portal.",
      cta: "Ver planes",
    };
  }
  if (r.tier === "premium") {
    return {
      title: "Aparezca primero en el directorio",
      body: "Con el plan Destacado su negocio sale arriba en las búsquedas, en la página de inicio y puede publicar ofertas y anuncios.",
      cta: "Pasar a Destacado",
    };
  }
  return null;
}

export function reportHtml(r: BusinessReport, period: ReportPeriod): string {
  const site = baseUrl();
  const fichaUrl = `${site}/negocios/${r.slug}?utm_source=reporte&utm_medium=email`;
  const reviewUrl = `${site}/negocios/${r.slug}?utm_source=owner&utm_medium=review_request#resenas`;
  const trend = trendText(r);
  const offer = upsell(r);
  const stat = (value: string, label: string) => `
    <td width="33%" style="padding:6px" valign="top">
      <div style="background:#F3F6F3;border-radius:12px;padding:16px 8px;text-align:center">
        <p style="margin:0;font-size:28px;font-weight:700;color:#124934">${value}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#3A5749">${label}</p>
      </div>
    </td>`;

  const rankLine =
    r.categoryRank && r.categoryName
      ? `<p style="margin:0 0 20px;font-size:15px;color:#0C1E17">Su ficha es la <b>#${r.categoryRank} más vista</b> de ${r.categorySize} en <b>${esc(r.categoryName)}</b>.</p>`
      : "";

  const missingBlock = r.missing.length
    ? `<div style="border:1px solid #EAD9B8;background:#FFFBF2;border-radius:12px;padding:18px 20px;margin:0 0 20px">
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0C1E17">A su ficha le falta: ${r.missing.map((m) => MISSING_LABELS[m].toLowerCase()).join(", ")}</p>
        <p style="margin:0 0 14px;font-size:14px;color:#3A5749">Las fichas completas aparecen en “Cerca de mí” y “Abierto ahora”. Toma 2 minutos y no necesita contraseña.</p>
        <a href="${updateUrl(r.slug)}" style="display:inline-block;background:#124934;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:10px">Completar mi ficha</a>
      </div>`
    : "";

  const reviewsLine =
    r.reviewCount === 0
      ? `Aún no tiene reseñas. Las primeras hacen la mayor diferencia: <a href="https://wa.me/?text=${encodeURIComponent(`¡Hola! Si le gustó la atención en ${r.name}, ¿nos deja una reseña? ${reviewUrl}`)}" style="color:#1B7F5B;font-weight:600">pídalas por WhatsApp</a>.`
      : `Tiene ${r.reviewCount} reseña${r.reviewCount !== 1 ? "s" : ""}${r.avgRating ? ` con ${r.avgRating.toFixed(1)} estrellas de promedio` : ""}${r.newReviews ? `, ${r.newReviews} nueva${r.newReviews !== 1 ? "s" : ""} este mes` : ""}. <a href="https://wa.me/?text=${encodeURIComponent(`¡Hola! Si le gustó la atención en ${r.name}, ¿nos deja una reseña? ${reviewUrl}`)}" style="color:#1B7F5B;font-weight:600">Pida más por WhatsApp</a>.`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(reportSubject(r, period))}</title></head>
<body style="margin:0;padding:0;background:#EDF1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDF1EC;padding:32px 12px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="background:#124934;border-radius:16px 16px 0 0;padding:28px 32px">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#B5C9C0">Resumen de ${period.label}</p>
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.25">${esc(r.name)} en olanchito.com</h1>
        </td></tr>
        <tr><td style="background:#ffffff;padding:28px 26px 8px">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px"><tr>
            ${stat(String(r.contacts), r.contacts === 1 ? "cliente le contactó" : "clientes le contactaron")}
            ${stat(r.totalViews.toLocaleString("es-HN"), "visitas a su ficha (total)")}
            ${stat(String(r.reviewCount), r.reviewCount === 1 ? "reseña" : "reseñas")}
          </tr></table>
          ${r.contacts > 0 ? `<p style="margin:0 0 8px;font-size:14px;color:#3A5749">${r.whatsappClicks} por WhatsApp y ${r.phoneClicks} por llamada. ${trend}</p>` : `<p style="margin:0 0 8px;font-size:14px;color:#3A5749">Este mes nadie tocó los botones de contacto de su ficha. Una ficha completa y con reseñas ayuda a que le escriban.</p>`}
          ${rankLine}
          ${missingBlock}
          <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#3A5749">${reviewsLine}</p>
          ${
            offer
              ? `<div style="background:#124934;border-radius:12px;padding:20px 22px;margin:0 0 20px">
                  <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#ffffff">${offer.title}</p>
                  <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#D4E3DC">${offer.body}</p>
                  <a href="${site}/precios?utm_source=reporte&utm_medium=email" style="display:inline-block;background:#ffffff;color:#124934;text-decoration:none;font-weight:700;font-size:14px;padding:10px 18px;border-radius:10px">${offer.cta}</a>
                </div>`
              : ""
          }
          <p style="margin:0 0 24px;font-size:14px"><a href="${fichaUrl}" style="color:#1B7F5B;font-weight:600">Ver mi ficha en olanchito.com</a></p>
        </td></tr>
        <tr><td style="background:#F3F6F3;border-radius:0 0 16px 16px;padding:18px 26px">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#536F60">Recibe este correo porque ${esc(r.name)} está en el Directorio Olanchito. Los contactos cuentan los toques en los botones de WhatsApp y llamada de su ficha.
          <a href="${unsubscribeUrl(r.slug)}" style="color:#536F60">No quiero recibir este resumen</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Versión corta para mandar por WhatsApp a dueños sin correo o que prefieren WhatsApp
export function reportText(r: BusinessReport, period: ReportPeriod): string {
  const lines = [
    `¡Hola! Este es el resumen de ${period.label} de *${r.name}* en olanchito.com:`,
    r.contacts > 0
      ? `• ${r.contacts} cliente${r.contacts !== 1 ? "s" : ""} le contact${r.contacts !== 1 ? "aron" : "ó"} (${r.whatsappClicks} por WhatsApp, ${r.phoneClicks} por llamada)`
      : "• Este mes nadie tocó los botones de contacto de su ficha",
    `• ${r.totalViews} visitas a su ficha en total`,
    `• ${r.reviewCount} reseña${r.reviewCount !== 1 ? "s" : ""}`,
  ];
  if (r.categoryRank && r.categoryName) lines.push(`• Es la #${r.categoryRank} más vista en ${r.categoryName}`);
  if (r.missing.length) {
    lines.push("", `Le falta: ${r.missing.map((m) => MISSING_LABELS[m].toLowerCase()).join(", ")}. Puede completarlo aquí sin contraseña: ${updateUrl(r.slug)}`);
  }
  lines.push("", `Su ficha: ${baseUrl()}/negocios/${r.slug}`);
  return lines.join("\n");
}
