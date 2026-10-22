// Imagen de un negocio: la foto subida al storage o, si no tiene, su portada automática
// (/portada/[slug]: nombre, ícono y color de su categoría). Se usa en servidor y en cliente.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUCKET = process.env.BUCKET_NAME ?? "Olanchito-guide";
const SITE = "https://olanchito.com";

export function hasPhoto(path: string | null | undefined): boolean {
  return Boolean(path && path.trim());
}

export function photoUrl(path: string): string {
  const clean = path.startsWith("business/") || path.includes("/") ? path : `business/${path}`;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${clean}`;
}

export function coverUrl(slug: string, absolute = false): string {
  return `${absolute ? SITE : ""}/portada/${encodeURIComponent(slug)}`;
}

// absolute: para Open Graph y datos estructurados, que necesitan la URL completa
export function businessImageUrl(path: string | null | undefined, slug: string, absolute = false): string {
  return hasPhoto(path) ? photoUrl(path!) : coverUrl(slug, absolute);
}
