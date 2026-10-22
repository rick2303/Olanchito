import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/adminAuth";
import { createServerClient } from "@/lib/supabase-server";
import { inviteOwner } from "@/lib/ownerInvite";
import { CLAIM_FIELD, type ClaimRequest } from "@/lib/businessFields";
import { cleanNumber, isMobile, newVerification } from "@/lib/claimVerification";

// El admin gestiona un reclamo:
//  - send_code: genera el código para mandarlo al número PÚBLICO del negocio
//  - approve:   asigna el dueño e invita al portal (exige el código verificado si la ficha tiene número)
//  - reject:    descarta
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, action, manual } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !["approve", "reject", "send_code"].includes(action)) {
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
    .select("id, name, slug, owner_email, whatsapp, phone")
    .eq("slug", row.business_slug)
    .maybeSingle();
  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  if (business.owner_email) return NextResponse.json({ error: "Ese negocio ya tiene dueño" }, { status: 409 });

  // Número público del negocio: el de la ficha, nunca el que escribió quien reclama
  const publicNumber = cleanNumber(business.whatsapp) ?? cleanNumber(business.phone);

  if (action === "send_code") {
    if (!publicNumber) return NextResponse.json({ error: "La ficha no tiene número público" }, { status: 400 });
    const { code, verification } = newVerification(row.id);
    const updated: ClaimRequest = { ...claim, verification };
    const { error } = await supabase.from("correction_suggestions").update({ description: JSON.stringify(updated) }).eq("id", row.id);
    if (error) return NextResponse.json({ error: "No se pudo guardar el código" }, { status: 500 });
    return NextResponse.json({
      ok: true,
      code,
      number: publicNumber,
      whatsapp: isMobile(publicNumber),
      expires_at: verification.expires_at,
      business_name: business.name,
    });
  }

  // approve: con número público, solo si quien reclama ingresó el código correcto
  const verified = Boolean(claim.verification?.verified_at);
  if (publicNumber && !verified) {
    return NextResponse.json({ error: "Primero envíe el código al número del negocio y espere a que lo verifiquen." }, { status: 409 });
  }
  if (!publicNumber && manual !== true) {
    return NextResponse.json({ error: "La ficha no tiene número: confirme la verificación manual." }, { status: 409 });
  }

  const { error } = await supabase.from("businesses").update({ owner_email: claim.email }).eq("id", business.id);
  if (error) return NextResponse.json({ error: "No se pudo asignar el dueño" }, { status: 500 });

  // Ya tiene dueño: se descartan todos los reclamos de ese negocio
  await supabase.from("correction_suggestions").delete().eq("field", CLAIM_FIELD).eq("business_slug", business.slug);
  revalidatePath(`/negocios/${business.slug}`);

  try {
    const invite = await inviteOwner(business.id, claim.email);
    return NextResponse.json({ ok: true, invite: invite.type, claim });
  } catch (err) {
    return NextResponse.json({ ok: true, invite: "failed", inviteError: err instanceof Error ? err.message : "Error", claim });
  }
}
