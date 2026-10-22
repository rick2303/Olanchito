import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { CLAIM_FIELD, cleanPhone, cleanText, type ClaimRequest } from "@/lib/businessFields";

const ROLES = ["Dueño", "Encargado o administrador", "Familiar del dueño", "Empleado"];

// Alguien dice ser el dueño de un negocio que no tiene dueño asignado. Queda para revisión del admin.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.slug !== "string") return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  // Anti-spam: campo trampa o envío en menos de 3 segundos
  if (body.website || (typeof body.startedAt === "number" && Date.now() - body.startedAt < 3000)) {
    return NextResponse.json({ ok: true });
  }

  const name = cleanText(body.name, 80);
  const email = cleanText(body.email, 120)?.toLowerCase() ?? null;
  const whatsapp = cleanPhone(body.whatsapp);
  const role = ROLES.includes(body.role) ? body.role : ROLES[0];

  if (!name) return NextResponse.json({ error: "Escriba su nombre." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Escriba un correo válido: ahí le llegará el acceso a su portal." }, { status: 400 });
  }
  if (!whatsapp) return NextResponse.json({ error: "El WhatsApp debe tener 8 dígitos." }, { status: 400 });

  const supabase = createServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, slug, owner_email, whatsapp, phone")
    .eq("slug", body.slug)
    .maybeSingle();
  if (!business) return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });
  if (business.owner_email) {
    return NextResponse.json({ error: "Este negocio ya tiene un dueño registrado. Si es usted, inicie sesión en el portal." }, { status: 409 });
  }

  // Un reclamo pendiente por negocio y correo
  const { data: pending } = await supabase
    .from("correction_suggestions")
    .select("description")
    .eq("field", CLAIM_FIELD)
    .eq("business_slug", business.slug);
  if ((pending ?? []).some((p) => p.description.includes(`"email":"${email}"`))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const claim: ClaimRequest = {
    name,
    email,
    whatsapp,
    role,
    message: cleanText(body.message, 500),
    phone_matches: [business.whatsapp, business.phone].some((p) => cleanPhone(p ?? "") === whatsapp),
  };

  const { error } = await supabase.from("correction_suggestions").insert({
    business_slug: business.slug,
    business_name: business.name,
    field: CLAIM_FIELD,
    description: JSON.stringify(claim),
  });
  if (error) return NextResponse.json({ error: "No se pudo enviar. Intente de nuevo." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
