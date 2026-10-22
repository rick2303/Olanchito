import { ImageResponse } from "next/og";
import { cloneElement } from "react";
import { createServerClient } from "@/lib/supabase-server";
import { categoryIcon } from "@/lib/categoryIcons";

// Portada automática para negocios sin foto: nombre, ícono y color de su categoría.
// Así el listado no se ve como una fila de imágenes genéricas repetidas.
export const runtime = "edge";
export const revalidate = 86400;

const WIDTH = 1200;
const HEIGHT = 675; // 16:9, igual que las tarjetas del directorio

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { data: business } = await createServerClient()
    .from("businesses")
    .select("name, categories(name, icon)")
    .eq("slug", params.slug)
    .maybeSingle();

  const name = business?.name?.trim() || "Negocio en Olanchito";
  const category = (business?.categories as { name?: string; icon?: string | null } | null) ?? null;
  const def = categoryIcon(category?.icon);
  const icon = cloneElement(def.el, { size: 150, color: "#ffffff" });
  const titleSize = name.length > 34 ? 60 : name.length > 22 ? 72 : 86;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#124934",
          backgroundImage: `linear-gradient(135deg, ${def.accent} 0%, #124934 75%)`,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.16)",
            }}
          >
            {category?.name ?? "Directorio Olanchito"}
          </div>
          <div style={{ display: "flex", opacity: 0.9 }}>{icon}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>{name}</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 30, opacity: 0.8 }}>Olanchito, Honduras · olanchito.com</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    },
  );
}
