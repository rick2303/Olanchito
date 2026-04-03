import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_slug, business_name, field, description } = body;

    if (!business_slug || !field || !description?.trim()) {
      return NextResponse.json({ error: "Campos requeridos faltantes." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("correction_suggestions").insert({
      business_slug,
      business_name,
      field,
      description: description.trim(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
