import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import { verifyUpdateToken } from "@/lib/updateLink";
import { cleanLocation, cleanPhone, cleanServices, cleanText, MISSING_LABELS, OWNER_UPDATE_FIELD } from "@/lib/businessFields";

const FIELD_LABELS: Record<string, string> = { ...MISSING_LABELS, address: "Dirección", phone: "Teléfono" };

// El dueño guarda los cambios de su ficha desde el enlace firmado
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.slug !== "string") return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  if (!verifyUpdateToken(body.slug, body.token)) {
    return NextResponse.json({ error: "El enlace venció o no es válido. Pida uno nuevo." }, { status: 401 });
  }

  const description = cleanText(body.description, 1200);
  const hours = cleanText(body.hours, 200);
  const address = cleanText(body.address, 200);
  const whatsapp = cleanPhone(body.whatsapp);
  const phone = cleanPhone(body.phone);
  const location = cleanLocation(body.location);
  const services = cleanServices(body.services);

  if (body.whatsapp && !whatsapp) return NextResponse.json({ error: "El WhatsApp debe tener 8 dígitos." }, { status: 400 });
  if (body.phone && !phone) return NextResponse.json({ error: "El teléfono debe tener 8 dígitos." }, { status: 400 });
  if (body.location && !location) return NextResponse.json({ error: "La ubicación debe estar en Olanchito." }, { status: 400 });

  const supabase = createServerClient();
  const { data: current } = await supabase
    .from("businesses")
    .select("name, slug, description, hours, address, whatsapp, phone, location, services")
    .eq("slug", body.slug)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });

  // Solo se guarda lo que cambió
  const candidate: Record<string, unknown> = { description, hours, address, whatsapp, phone, location, services };
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(candidate)) {
    if (value === null) continue;
    if (JSON.stringify(value) !== JSON.stringify((current as Record<string, unknown>)[key])) update[key] = value;
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true, unchanged: true });

  const { error } = await supabase.from("businesses").update(update).eq("slug", body.slug);
  if (error) return NextResponse.json({ error: "No se pudo guardar. Intente de nuevo." }, { status: 500 });

  // Aviso para el admin en la pestaña de sugerencias
  await supabase.from("correction_suggestions").insert({
    business_slug: current.slug,
    business_name: current.name,
    field: OWNER_UPDATE_FIELD,
    description: `El dueño actualizó: ${Object.keys(update).map((k) => FIELD_LABELS[k] ?? k).join(", ")}`,
  });

  revalidatePath(`/negocios/${current.slug}`);
  return NextResponse.json({ ok: true });
}
