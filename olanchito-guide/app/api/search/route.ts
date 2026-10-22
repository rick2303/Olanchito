import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { expandQuery, scoreMatch } from "@/lib/search";

// Sugerencias del buscador (autocompletado). Usa la misma lógica que la página de resultados.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const { data, error } = await supabase
    .from("businesses")
    .select("name, slug, description, address, services, categories(name)");
  if (error) return NextResponse.json({ results: [] }, { status: 500 });

  const groups = expandQuery(q);
  const results = (data ?? [])
    .map((b) => {
      const categoryName = (b.categories as { name?: string } | null)?.name ?? "";
      return { name: b.name, slug: b.slug, category: categoryName, score: scoreMatch({ ...b, categoryName }, groups) };
    })
    .filter((b) => b.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "es"))
    .slice(0, 6)
    .map(({ name, slug, category }) => ({ name, slug, category }));

  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
}
