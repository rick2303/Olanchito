import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@/lib/supabase-server";
import { verifyUpdateToken } from "@/lib/updateLink";
import { OWNER_UPDATE_FIELD } from "@/lib/businessFields";
import { photoUrl } from "@/lib/businessImage";

const BUCKET = process.env.BUCKET_NAME ?? "Olanchito-guide";
// Vercel acepta hasta ~4.5 MB por petición; el navegador ya reduce la foto antes de enviarla
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// El dueño sube la foto principal de su negocio desde el enlace firmado (sin cuenta)
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const slug = form?.get("slug");
  const token = form?.get("token");
  const file = form?.get("file");

  if (typeof slug !== "string" || typeof token !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  if (!verifyUpdateToken(slug, token)) {
    return NextResponse.json({ error: "El enlace venció o no es válido. Pida uno nuevo." }, { status: 401 });
  }
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use una foto JPG, PNG o WebP." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "La foto es muy pesada (máximo 4 MB)." }, { status: 400 });

  const supabase = createServerClient();
  const { data: business } = await supabase.from("businesses").select("id, name, slug, image").eq("slug", slug).maybeSingle();
  if (!business) return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });

  const path = `business/${randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "No se pudo subir la foto. Intente de nuevo." }, { status: 500 });

  const { error } = await supabase.from("businesses").update({ image: path }).eq("id", business.id);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: "No se pudo guardar la foto." }, { status: 500 });
  }

  // La foto anterior ya no se usa
  if (business.image && business.image !== path) {
    const old = business.image.includes("/") ? business.image : `business/${business.image}`;
    await supabase.storage.from(BUCKET).remove([old]);
  }

  await supabase.from("correction_suggestions").insert({
    business_slug: business.slug,
    business_name: business.name,
    field: OWNER_UPDATE_FIELD,
    description: "El dueño subió una foto nueva",
  });

  revalidatePath(`/negocios/${business.slug}`);
  return NextResponse.json({ ok: true, url: photoUrl(path) });
}
