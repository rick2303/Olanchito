import { ReactNode } from "react";
import type { Metadata } from "next";

// Página personal (favoritos guardados en el navegador): no aporta nada en Google
export const metadata: Metadata = {
  title: "Mis favoritos",
  robots: { index: false, follow: true },
};

export default function FavoritosLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
