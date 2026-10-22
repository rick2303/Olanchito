import { permanentRedirect } from "next/navigation";

// Ruta vieja en inglés: redirige a /negocios conservando búsqueda y filtros
export default function BusinessesRedirect({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (typeof value === "string") params.set(key, value);
  }
  const qs = params.toString();
  permanentRedirect(qs ? `/negocios?${qs}` : "/negocios");
}
