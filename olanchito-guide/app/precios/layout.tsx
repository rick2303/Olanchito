import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precios: aparecer es gratis, Destacado desde L 250 al mes",
  description:
    "Aparecer en el directorio de Olanchito es gratis. El plan Destacado (L 250 al mes o L 2,500 al año) pone su negocio primero en su categoría, con galería de fotos y catálogo.",
  alternates: { canonical: "https://olanchito.com/precios" },
  openGraph: {
    title: "Precios | Directorio Olanchito",
    description: "Aparecer es gratis. Destacado: L 250 al mes o L 2,500 al año, máximo 3 negocios por categoría.",
    url: "https://olanchito.com/precios",
    siteName: "Directorio Olanchito",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Directorio Olanchito" }],
    locale: "es_HN",
    type: "website",
  },
};

export default function PreciosLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
