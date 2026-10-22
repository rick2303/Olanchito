import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { CLAIM_FIELD, cleanText, type ClaimRequest } from "@/lib/businessFields";
import { checkCode, MAX_ATTEMPTS } from "@/lib/claimVerification";

const MESSAGES: Record<string, string> = {
  wrong: "El código no es correcto. Revise el mensaje que llegó al número del negocio.",
  expired: "El código venció. Pídanos uno nuevo.",
  locked: "Demasiados intentos. Escríbanos para recibir un código nuevo.",
  missing: "Todavía no hemos enviado el código a su negocio. Le avisaremos por WhatsApp.",
};

// Quien reclama ingresa el código que llegó al número público del negocio
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const email = cleanText(body?.email, 120)?.toLowerCase() ?? "";
  const code = typeof body?.code === "string" ? body.code : "";
  if (!slug || !email || !code) return NextResponse.json({ error: "Complete el correo y el código." }, { status: 400 });

  const supabase = createServerClient();
  const { data: rows } = await supabase
    .from("correction_suggestions")
    .select("id, description")
    .eq("field", CLAIM_FIELD)
    .eq("business_slug", slug);

  const row = (rows ?? []).find((r) => {
    try {
      return (JSON.parse(r.description) as ClaimRequest).email === email;
    } catch {
      return false;
    }
  });
  // Mismo mensaje si no existe el reclamo, para no revelar qué correos reclamaron qué negocio
  if (!row) return NextResponse.json({ error: MESSAGES.missing }, { status: 404 });

  const claim = JSON.parse(row.description) as ClaimRequest;
  const result = checkCode(row.id, claim.verification, code);

  if (result === "ok") {
    if (!claim.verification!.verified_at) {
      claim.verification!.verified_at = new Date().toISOString();
      await supabase.from("correction_suggestions").update({ description: JSON.stringify(claim) }).eq("id", row.id);
    }
    return NextResponse.json({ ok: true });
  }

  if (result === "wrong") {
    claim.verification!.attempts += 1;
    await supabase.from("correction_suggestions").update({ description: JSON.stringify(claim) }).eq("id", row.id);
    const left = MAX_ATTEMPTS - claim.verification!.attempts;
    return NextResponse.json(
      { error: left > 0 ? `${MESSAGES.wrong} Le quedan ${left} intento${left !== 1 ? "s" : ""}.` : MESSAGES.locked },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: MESSAGES[result] }, { status: 400 });
}
