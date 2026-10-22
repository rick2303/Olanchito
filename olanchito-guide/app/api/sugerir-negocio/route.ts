import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  cleanLocation,
  cleanPhone,
  cleanText,
  NEW_BUSINESS_FIELD,
  NEW_BUSINESS_SLUG,
  type NewBusinessProposal,
} from "@/lib/businessFields";
import { normalizeText } from "@/lib/search";

// Un vecino propone un negocio que falta. Queda pendiente hasta que el admin lo apruebe.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  // Anti-spam: campo oculto que solo llenan los bots, o formulario enviado en menos de 3 segundos
  if (body.website || (typeof body.startedAt === "number" && Date.now() - body.startedAt < 3000)) {
    return NextResponse.json({ ok: true });
  }

  const name = cleanText(body.name, 120);
  const whatsapp = cleanPhone(body.whatsapp);
  const phone = cleanPhone(body.phone);
  if (!name || name.length < 3) return NextResponse.json({ error: "Escriba el nombre del negocio." }, { status: 400 });
  if (!whatsapp && !phone) {
    return NextResponse.json({ error: "Agregue un WhatsApp o teléfono de 8 dígitos para poder confirmarlo." }, { status: 400 });
  }

  const supabase = createServerClient();

  // Evita proponer negocios que ya están en el directorio o que alguien ya propuso
  const [{ data: businesses }, { data: pending }] = await Promise.all([
    supabase.from("businesses").select("slug, name, whatsapp, phone"),
    supabase.from("correction_suggestions").select("business_name").eq("field", NEW_BUSINESS_FIELD),
  ]);
  const key = normalizeText(name);
  const existing = (businesses ?? []).find(
    (b) =>
      normalizeText(b.name) === key ||
      (whatsapp && cleanPhone(b.whatsapp ?? "") === whatsapp) ||
      (phone && cleanPhone(b.phone ?? "") === phone),
  );
  if (existing) {
    return NextResponse.json(
      { error: `Parece que ya está en el directorio como "${existing.name}".`, slug: existing.slug },
      { status: 409 },
    );
  }
  if ((pending ?? []).some((p) => normalizeText(p.business_name) === key)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let categoryName: string | null = null;
  const categoryId = typeof body.category_id === "string" && body.category_id ? body.category_id : null;
  if (categoryId) {
    const { data: cat } = await supabase.from("categories").select("name").eq("id", categoryId).maybeSingle();
    categoryName = cat?.name ?? null;
  }

  const proposal: NewBusinessProposal = {
    name,
    category_id: categoryName ? categoryId : null,
    category_name: categoryName,
    whatsapp,
    phone,
    address: cleanText(body.address, 200),
    description: cleanText(body.description, 600),
    location: cleanLocation(body.location),
    submitter_name: cleanText(body.submitter_name, 80),
    submitter_contact: cleanText(body.submitter_contact, 80),
  };

  const { error } = await supabase.from("correction_suggestions").insert({
    business_slug: NEW_BUSINESS_SLUG,
    business_name: name,
    field: NEW_BUSINESS_FIELD,
    description: JSON.stringify(proposal),
  });
  if (error) return NextResponse.json({ error: "No se pudo enviar. Intente de nuevo." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
