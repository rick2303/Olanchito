import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/adminAuth";
import { createServerClient } from "@/lib/supabase-server";
import { updateUrl } from "@/lib/updateLink";
import { NEW_BUSINESS_FIELD, slugify, type NewBusinessProposal } from "@/lib/businessFields";

// El admin aprueba (crea el negocio) o rechaza una propuesta de la comunidad
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, action, category_id } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: row } = await supabase
    .from("correction_suggestions")
    .select("id, description")
    .eq("id", id)
    .eq("field", NEW_BUSINESS_FIELD)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });

  if (action === "reject") {
    await supabase.from("correction_suggestions").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }

  let proposal: NewBusinessProposal;
  try {
    proposal = JSON.parse(row.description);
  } catch {
    return NextResponse.json({ error: "Propuesta dañada" }, { status: 400 });
  }

  const base = slugify(proposal.name) || "negocio";
  let slug = base;
  for (let i = 2; ; i++) {
    const { data } = await supabase.from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${i}`;
  }

  const { error } = await supabase.from("businesses").insert({
    name: proposal.name,
    slug,
    category_id: (typeof category_id === "string" && category_id) || proposal.category_id,
    description: proposal.description,
    whatsapp: proposal.whatsapp,
    phone: proposal.phone ?? proposal.whatsapp,
    address: proposal.address,
    location: proposal.location,
    hours: proposal.hours ?? null,
    // Lo propuso un vecino: queda sin verificar hasta que el dueño confirme sus datos
    verified: false,
    featured: false,
    view_count: 0,
    socials: {
      ...(proposal.website && { website: proposal.website }),
      ...(proposal.instagram && { instagram: proposal.instagram }),
    },
  });
  if (error) return NextResponse.json({ error: "No se pudo crear el negocio" }, { status: 500 });

  await supabase.from("correction_suggestions").delete().eq("id", id);
  revalidatePath("/negocios");
  revalidatePath("/");

  return NextResponse.json({ ok: true, slug, updateUrl: updateUrl(slug), whatsapp: proposal.whatsapp });
}
