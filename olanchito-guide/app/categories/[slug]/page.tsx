import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BusinessCard from "@/components/BusinessCard";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

export const revalidate = 3600;

const BASE_URL = "https://olanchito.com";
const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";
const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

// Per-category SEO descriptions
const categoryDescriptions: Record<string, string> = {
  restaurantes:
    "Descubre los mejores restaurantes, comedores y cafeterías de Olanchito, Honduras. Consulta menús, horarios y contacta directamente.",
  ferreterias:
    "Encuentra ferreterías y proveedores de materiales de construcción en Olanchito. Compara precios y ubícalos en el mapa.",
  farmacias:
    "Localiza farmacias y servicios de salud en Olanchito, Honduras. Horarios, teléfonos y ubicaciones actualizadas.",
  "servicios-tecnicos":
    "Técnicos de reparación, electrónica y servicios especializados en Olanchito. Contacta directamente por teléfono o WhatsApp.",
  supermercados:
    "Supermercados, pulperías y tiendas de abarrotes en Olanchito, Honduras. Encuentra el más cercano a tu zona.",
  clinicas:
    "Clínicas, consultorios médicos y servicios de salud en Olanchito. Busca por especialidad y agenda tu cita.",
  bancos:
    "Bancos, cooperativas y servicios financieros disponibles en Olanchito, Yoro, Honduras.",
  "salones-de-belleza":
    "Salones de belleza, barberías y spas en Olanchito. Cortes, tratamientos y más.",
  talleres:
    "Talleres mecánicos, vulcanizadoras y servicios automotrices en Olanchito, Honduras.",
};

function getCategoryDescription(slug: string, name: string): string {
  return (
    categoryDescriptions[slug] ??
    `Encuentra los mejores negocios de ${name} en Olanchito, Honduras. Información de contacto, horarios, ubicación y reseñas de clientes reales.`
  );
}

export async function generateStaticParams() {
  const { data } = await supabase.from("categories").select("slug");
  return (data ?? []).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data: cat } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!cat) return {};

  const title = `${cat.name} en Olanchito | Directorio`;
  const description = getCategoryDescription(cat.slug, cat.name);

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/categories/${cat.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/categories/${cat.slug}`,
      siteName: "Directorio Olanchito",
      images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
      locale: "es_HN",
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!category) notFound();

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const { data: raw } = await supabase
    .from("businesses")
    .select("id, name, slug, address, image, description, featured, view_count, created_at")
    .eq("category_id", category.id);

  const { data: allReviews } = await supabase
    .from("reviews")
    .select("business_slug, rating")
    .eq("is_visible", true);

  const reviewStats: Record<string, { sum: number; count: number; positive: number }> = {};
  for (const r of allReviews ?? []) {
    const s = reviewStats[r.business_slug] ?? { sum: 0, count: 0, positive: 0 };
    s.sum += r.rating; s.count += 1;
    if (r.rating >= 4) s.positive += 1;
    reviewStats[r.business_slug] = s;
  }

  const businesses = (raw ?? [])
    .map((b) => {
      const isNew = b.created_at
        ? now - new Date(b.created_at).getTime() <= THREE_DAYS_MS
        : false;
      const stats = reviewStats[b.slug];
      const score = (b.view_count ?? 0) + (stats?.positive ?? 0) * 3;
      let imageUrl = FALLBACK_IMAGE;
      if (b.image) {
        const clean = b.image.startsWith("business/") ? b.image : `business/${b.image}`;
        const { data: img } = supabase.storage.from(BUCKET_NAME).getPublicUrl(clean);
        imageUrl = img?.publicUrl ?? FALLBACK_IMAGE;
      }
      return {
        ...b,
        isNew,
        score,
        image: imageUrl,
        avgRating: stats && stats.count > 0 ? stats.sum / stats.count : null,
        reviewCount: stats?.count ?? 0,
      };
    })
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return b.score - a.score;
    });

  const description = getCategoryDescription(category.slug, category.name);

  // JSON-LD schemas
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Categorías", item: `${BASE_URL}/categories` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${BASE_URL}/categories/${category.slug}` },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} en Olanchito`,
    description,
    numberOfItems: businesses.length,
    itemListElement: businesses.slice(0, 10).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      url: `${BASE_URL}/negocios/${b.slug}`,
    })),
  };

  return (
    <main className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* ─── HEADER ─────────────────────────────── */}
      <section className="section-container pt-8 pb-6 sm:pt-10 sm:pb-8">
        <Link
          href="/categories"
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: "var(--ink-3)" }}
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Todas las categorías
        </Link>

        <div className="badge-primary mb-3 w-fit">
          <BuildingStorefrontIcon className="h-3.5 w-3.5" />
          {category.name} en Olanchito
        </div>

        <h1
          className="text-3xl font-bold sm:text-4xl"
          style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
        >
          {category.name} en Olanchito
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
          {description}
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--ink-3)" }}>
          {businesses.length} negocio{businesses.length !== 1 ? "s" : ""} encontrado{businesses.length !== 1 ? "s" : ""}
        </p>
      </section>

      {/* ─── GRID ───────────────────────────────── */}
      <section className="section-container pb-16">
        {businesses.length === 0 ? (
          <div className="panel p-8 text-center">
            <BuildingStorefrontIcon className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--ink-3)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Aún no hay negocios en esta categoría
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--ink-3)" }}>
              ¿Tienes un negocio de {category.name}? ¡Regístralo gratis!
            </p>
            <Link href="/join" className="btn-primary mt-5 inline-flex !text-xs !py-2">
              Registrar negocio
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((b) => (
                <BusinessCard
                  key={b.id}
                  business={{
                    name: b.name,
                    slug: b.slug,
                    image: b.image,
                    address: b.address ?? "",
                    description: b.description ?? "",
                    category: category.name,
                    featured: b.featured ?? false,
                    isNew: b.isNew,
                    avgRating: b.avgRating ?? undefined,
                    reviewCount: b.reviewCount,
                  }}
                />
              ))}
            </div>

            <div
              className="mt-10 rounded-2xl p-6 text-center"
              style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                ¿Tu negocio de {category.name} no aparece?
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--ink-3)" }}>
                Regístralo gratis y llega a más clientes en Olanchito.
              </p>
              <Link href="/join" className="btn-primary mt-4 inline-flex !text-xs !py-2">
                Registrar negocio
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
