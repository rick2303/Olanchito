import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/adminAuth";
import { createServerClient } from "@/lib/supabase-server";
import { inviteOwner } from "@/lib/ownerInvite";
import { CLAIM_FIELD, type ClaimRequest } from "@/lib/businessFields";

// El admin aprueba (asigna el dueño e invita al portal) o rechaza un reclamo
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, action } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: row } = await supabase
    .from("correction_suggestions")
    .select("id, business_slug, description")
    .eq("id", id)
    .eq("field", CLAIM_FIELD)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Reclamo no encontrado" }, { status: 404 });

  if (action === "reject") {
    await supabase.from("correction_suggestions").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }

  const claim = JSON.parse(row.description) as ClaimRequest;
  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug, owner_email")
    .eq("slug", row.business_slug)
    .maybeSingle();
  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  if (business.owner_email) return NextResponse.json({ error: "Ese negocio ya tiene dueño" }, { status: 409 });

  const { error } = await supabase.from("businesses").update({ owner_email: claim.email }).eq("id", business.id);
  if (error) return NextResponse.json({ error: "No se pudo asignar el dueño" }, { status: 500 });

  // Se borran todos los reclamos de ese negocio: ya tiene dueño
  await supabase.from("correction_suggestions").delete().eq("field", CLAIM_FIELD).eq("business_slug", business.slug);
  revalidatePath(`/negocios/${business.slug}`);

  try {
    const invite = await inviteOwner(business.id, claim.email);
    return NextResponse.json({ ok: true, invite: invite.type, claim });
  } catch (err) {
    return NextResponse.json({ ok: true, invite: "failed", inviteError: err instanceof Error ? err.message : "Error", claim });
  }
}
