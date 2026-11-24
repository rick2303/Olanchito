// Cargador de imágenes para next/image.
// La optimización de imágenes de Vercel tiene un cupo mensual en el plan gratis; al agotarse
// responde 402 y las fotos dejan de verse. Por eso las fotos remotas (Supabase) se redimensionan
// con wsrv.nl, un proxy de imágenes gratuito con caché en CDN, y las locales se sirven tal cual.
export default function imageLoader({ src, width, quality }) {
  if (!/^https?:\/\//.test(src)) {
    return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  }
  return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}&output=webp&we`;
}
