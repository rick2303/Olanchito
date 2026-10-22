import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { verifyToken } from "@/lib/updateLink";
import { REPORT_OPTOUT_FIELD } from "@/lib/businessFields";

// El dueño confirma que no quiere recibir más el reporte mensual
export async function POST(req: NextRequest) {
  const { slug, token } = await req.json().catch(() => ({}));
  if (typeof slug !== "string" || !verifyToken("report-unsubscribe", slug, token)) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: existing } = await supabase
    .from("correction_suggestions")
    .select("id")
    .eq("field", REPORT_OPTOUT_FIELD)
    .eq("business_slug", slug)
    .limit(1);

  if (!existing?.length) {
    const { data: business } = await supabase.from("businesses").select("name").eq("slug", slug).maybeSingle();
    await supabase.from("correction_suggestions").insert({
      business_slug: slug,
      business_name: business?.name ?? slug,
      field: REPORT_OPTOUT_FIELD,
      description: "El dueño pidió no recibir el reporte mensual",
    });
  }

  return NextResponse.json({ ok: true });
}
