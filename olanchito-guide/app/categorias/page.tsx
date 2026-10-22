import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowRightIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import CategoryCard from "@/components/CategoryCard";
import { categoryIcon } from "@/lib/categoryIcons";

export const metadata = {
  title: { absolute: "Categorías de negocios en Olanchito, Honduras | Directorio Olanchito" },
  description: "Explora todas las categorías de negocios en Olanchito, Honduras: ferreterías, restaurantes, farmacias, clínicas y más. Directorio local actualizado.",
  alternates: { canonical: "https://olanchito.com/categorias" },
  openGraph: {
    title: "Categorías de negocios en Olanchito, Honduras | Directorio Olanchito",
    description: "Explora todas las categorías de negocios en Olanchito, Honduras: ferreterías, restaurantes, farmacias, clínicas y más. Directorio local actualizado.",
    url: "https://olanchito.com/categorias",
    siteName: "Directorio Olanchito",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Directorio Olanchito" }],
    locale: "es_HN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Categorías de negocios en Olanchito, Honduras | Directorio Olanchito",
    description: "Explora todas las categorías de negocios en Olanchito, Honduras: ferreterías, restaurantes, farmacias y más.",
    images: ["/og-image.png"],
  },
};

type Category = { id: string; name: string; slug: string; icon?: string | null; businesses?: { count: number }[] };

export default async function CategoriasPage() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, businesses(count)");

  if (error) {
    return (
      <main className="page-shell">
        <section className="section-container section-gap">
          <div className="panel p-8">
            <p className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>
              Error cargando categorías.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const list = (categories ?? []) as Category[];
  const countOf = (c: Category) => c.businesses?.[0]?.count ?? 0;
  // Primero las categorías con negocios; las vacías al final para no mandar a la gente a páginas sin nada
  const sortedCategories = list
    .filter((c) => c.name?.toLowerCase() !== "otros")
    .sort((a, b) => Number(countOf(b) > 0) - Number(countOf(a) > 0) || a.name.localeCompare(b.name, "es"));
  const otros = list.find((c) => c.name?.toLowerCase() === "otros");
  if (otros) sortedCategories.push(otros);

  return (
    <main className="page-shell">

      {/* ─── HEADER ──────────────────────────────────── */}
      <section className="section-container pt-10 pb-8">
        <div className="max-w-2xl">
          <div className="badge-primary mb-4 w-fit">
            <Squares2X2Icon className="h-3.5 w-3.5" />
            Categorías
          </div>
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
          >
            Encuentre por tipo de servicio
          </h1>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--ink-2)" }}>
            Seleccione una categoría para explorar los negocios disponibles en Olanchito.
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Link href="/negocios" className="btn-primary">
              Ver todos los negocios
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="/registrar" className="btn-secondary">
              Registrar mi negocio
            </Link>
          </div>
        </div>
      </section>

      {/* ─── GRID ────────────────────────────────────── */}
      <section className="section-container pb-16 sm:pb-20">
        <div className="mb-5">
          <p className="text-xs font-medium" style={{ color: "var(--ink-3)" }}>
            {sortedCategories.length} categorías disponibles
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedCategories.map((cat) => {
            return (
              <CategoryCard
                key={cat.id}
                cat={{ id: cat.id, name: cat.name, slug: cat.slug }}
                iconDef={categoryIcon(cat.icon)}
                count={countOf(cat)}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
