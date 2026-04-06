import { supabase } from "@/lib/supabase";
import BusinessCard from "@/components/BusinessCard";
import BusinessFilters from "@/components/BusinessFilters";
import BusinessMapWrapper from "@/components/BusinessMapWrapper";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ListBulletIcon,
  MapIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

const BASE_URL = "https://olanchito.com";

type Props = {
  searchParams?: { category?: string; q?: string; page?: string; view?: string; nuevo?: string };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const categorySlug = (searchParams?.category ?? "").toLowerCase().trim();

  // When a category filter is active, point the canonical at the proper /categories/[slug] page.
  // This prevents Google from treating the filter URL as a duplicate of the category page.
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (cat) {
      const canonicalUrl = `${BASE_URL}/categories/${cat.slug}`;
      return {
        title: `${cat.name} en Olanchito | Directorio`,
        description: `Encuentra los mejores negocios de ${cat.name} en Olanchito, Honduras.`,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          title: `${cat.name} en Olanchito | Directorio`,
          url: canonicalUrl,
          siteName: "Directorio Olanchito",
          images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
          locale: "es_HN",
          type: "website",
        },
      };
    }
  }

  return {
    title: "Negocios | Directorio Olanchito",
    description: "Explora todos los negocios registrados en el directorio de Olanchito, Honduras. Encuentra ferreterías, restaurantes, farmacias y más.",
    alternates: { canonical: `${BASE_URL}/businesses` },
    openGraph: {
      title: "Negocios | Directorio Olanchito",
      description: "Explora todos los negocios registrados en el directorio de Olanchito, Honduras.",
      url: `${BASE_URL}/businesses`,
      siteName: "Directorio Olanchito",
      images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Directorio Olanchito" }],
      locale: "es_HN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Negocios | Directorio Olanchito",
      description: "Explora todos los negocios registrados en el directorio de Olanchito, Honduras.",
      images: ["/og-image.webp"],
    },
  };
}

const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";
const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";
const PAGE_SIZE = 12;

export default async function BusinessesPage({ searchParams }: Props) {
  const categorySlug = (searchParams?.category ?? "").toLowerCase().trim();
  const q = (searchParams?.q ?? "").trim();
  const page = Math.max(parseInt(searchParams?.page ?? "1", 10) || 1, 1);
  const view = searchParams?.view === "map" ? "map" : "list";
  const filterNew = searchParams?.nuevo === "1";

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  let categoryId: string | null = null;
  let categoryName: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase.from("categories").select("id, name").eq("slug", categorySlug).maybeSingle();
    categoryId = cat?.id ?? null;
    categoryName = cat?.name ?? null;
  }

  // Fetch all matching businesses (sort handled in JS for score-based ranking)
  let query = supabase
    .from("businesses")
    .select("id, name, slug, category_id, address, image, description, featured, verified, subscription_tier, view_count, created_at, location");

  if (categoryId) query = query.eq("category_id", categoryId);
  if (q) query = query.ilike("name", `%${q}%`);

  const [{ data: rawData, error }, { data: allReviews }] = await Promise.all([
    query,
    supabase
      .from("reviews")
      .select("business_slug, rating")
      .eq("is_visible", true),
  ]);

  if (error) {
    return (
      <main className="page-shell">
        <section className="section-container section-gap">
          <div className="panel p-6">
            <p className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>
              Error cargando negocios.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Compute per-business: positive count (for scoring) + avg rating + total count (for card)
  const reviewStats: Record<string, { sum: number; count: number; positive: number }> = {};
  for (const r of allReviews ?? []) {
    const s = reviewStats[r.business_slug] ?? { sum: 0, count: 0, positive: 0 };
    s.sum += r.rating;
    s.count += 1;
    if (r.rating >= 4) s.positive += 1;
    reviewStats[r.business_slug] = s;
  }

  const positiveReviewCounts: Record<string, number> = Object.fromEntries(
    Object.entries(reviewStats).map(([slug, s]) => [slug, s.positive])
  );

  // "Nuevo" = created within the last 3 days
  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  // Sort: Destacado (tier=featured) > Nuevo > Score (views + reseñas positivas)
  // Within Destacado, still sort by score so los mejores van primero entre ellos
  const scored = (rawData ?? [])
    .map((b) => {
      const isNew = b.created_at
        ? now - new Date(b.created_at).getTime() <= THREE_DAYS_MS
        : false;
      const isDestacado = (b as { subscription_tier?: string }).subscription_tier === "featured" || b.featured;
      return {
        ...b,
        isNew,
        isDestacado,
        _score: (b.view_count ?? 0) + (positiveReviewCounts[b.slug] ?? 0) * 3,
      };
    })
    .sort((a, b) => {
      if (a.isDestacado && !b.isDestacado) return -1;
      if (!a.isDestacado && b.isDestacado) return 1;
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      if (b._score !== a._score) return b._score - a._score;
      return a.name.localeCompare(b.name, "es");
    });

  const filtered = filterNew ? scored.filter((b) => b.isNew) : scored;

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const pageStart = (page - 1) * PAGE_SIZE;

  const categoryMap = Object.fromEntries(
    (categories ?? []).map((c) => [c.id, c.name])
  );

  const businesses = filtered.slice(pageStart, pageStart + PAGE_SIZE).map((b) => {
    let imageUrl = FALLBACK_IMAGE;
    if (b.image && typeof b.image === "string") {
      const cleanPath = b.image.startsWith("business/") ? b.image : `business/${b.image}`;
      const { data: imgData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath);
      imageUrl = imgData?.publicUrl ?? FALLBACK_IMAGE;
    }
    const stats = reviewStats[b.slug];
    const avgRating = stats && stats.count > 0 ? stats.sum / stats.count : null;
    return {
      ...b,
      image: imageUrl,
      categoryName: categoryMap[b.category_id ?? ""] ?? "",
      avgRating,
      reviewCount: stats?.count ?? 0,
    };
  });

  // Map: only businesses with location data (respects nuevo filter too)
  const mapBusinesses = filtered
    .filter((b) => {
      const loc = b.location as { lat?: number; lng?: number } | null;
      return loc?.lat && loc?.lng;
    })
    .map((b) => {
      const loc = b.location as { lat: number; lng: number };
      return {
        name: b.name,
        slug: b.slug,
        category: categoryMap[b.category_id ?? ""] ?? undefined,
        address: b.address ?? undefined,
        featured: b.featured ?? false,
        isNew: b.isNew,
        lat: loc.lat,
        lng: loc.lng,
      };
    });

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/businesses?${params.toString()}`;
  };

  const buildViewHref = (v: "list" | "map") => {
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (q) params.set("q", q);
    if (v === "map") params.set("view", "map");
    return `/businesses?${params.toString()}`;
  };

  const pageTitle = categoryName
    ? categoryName
    : q
    ? `"${q}"`
    : "Todos los negocios";

  return (
    <main className="page-shell">

      {/* ─── PAGE HEADER ─────────────────────────────── */}
      <section className="section-container pt-8 pb-6 sm:pt-10 sm:pb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="badge-primary mb-3 w-fit">
              <BuildingStorefrontIcon className="h-3.5 w-3.5" />
              Directorio empresarial
            </div>
            <h1
              className="text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
            >
              {pageTitle}
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--ink-3)" }}>
              {total} resultado{total !== 1 ? "s" : ""}
              {view === "list" && ` · Página ${page} de ${totalPages}`}
            </p>
          </div>

          <div className="w-full lg:max-w-2xl xl:max-w-3xl flex flex-col gap-3">
            <BusinessFilters categories={categories ?? []} />
            {/* View toggle */}
            <div className="flex gap-2">
              <Link
                href={buildViewHref("list")}
                className={[
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                  view === "list" ? "btn-primary !py-2 !px-3" : "btn-secondary !py-2 !px-3",
                ].join(" ")}
              >
                <ListBulletIcon className="h-3.5 w-3.5" />
                Lista
              </Link>
              <Link
                href={buildViewHref("map")}
                className={[
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                  view === "map" ? "btn-primary !py-2 !px-3" : "btn-secondary !py-2 !px-3",
                ].join(" ")}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Mapa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RESULTS ─────────────────────────────────── */}
      <section className="section-container pb-16">
        {view === "map" ? (
          /* ── MAP VIEW ── */
          mapBusinesses.length === 0 ? (
            <div className="panel p-8 text-center">
              <MapIcon className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--ink-3)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                Sin ubicación disponible
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--ink-3)" }}>
                Los negocios filtrados aún no tienen coordenadas en el mapa.
              </p>
              <Link href={buildViewHref("list")} className="btn-secondary mt-5 inline-flex !text-xs !py-2">
                <ListBulletIcon className="h-3.5 w-3.5" />
                Ver en lista
              </Link>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs" style={{ color: "var(--ink-3)" }}>
                {mapBusinesses.length} negocio{mapBusinesses.length !== 1 ? "s" : ""} con ubicación en el mapa
              </p>
              <BusinessMapWrapper businesses={mapBusinesses} />
            </div>
          )
        ) : (
          /* ── LIST VIEW ── */
          businesses.length === 0 ? (
            <div className="panel p-8 text-center">
              <BuildingStorefrontIcon className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--ink-3)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                No se encontraron negocios
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--ink-3)" }}>
                Intente con otros filtros o busque en todas las categorías.
              </p>
              <Link href="/businesses" className="btn-primary mt-5 inline-flex !text-xs !py-2">
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Ver todos
              </Link>
            </div>
          ) : (
            <>
              <PaginationBar page={page} totalPages={totalPages} buildPageHref={buildPageHref} />
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={{
                      name: business.name,
                      slug: business.slug,
                      image: business.image,
                      address: business.address ?? "",
                      description: business.description ?? "",
                      category: business.categoryName,
                      featured: business.featured ?? false,
                      verified: business.verified ?? false,
                      isNew: business.isNew,
                      avgRating: business.avgRating ?? undefined,
                      reviewCount: business.reviewCount,
                    }}
                  />
                ))}
              </div>
              <div className="mt-8">
                <PaginationBar page={page} totalPages={totalPages} buildPageHref={buildPageHref} />
              </div>
            </>
          )
        )}
      </section>
    </main>
  );
}

function PaginationBar({
  page,
  totalPages,
  buildPageHref,
}: {
  page: number;
  totalPages: number;
  buildPageHref: (p: number) => string;
}) {
  if (totalPages <= 1) return null;

  const prev = Math.max(page - 1, 1);
  const next = Math.min(page + 1, totalPages);

  // Generate page numbers to show
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      <Link
        href={buildPageHref(prev)}
        aria-disabled={page === 1}
        className={[
          "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
          page === 1
            ? "pointer-events-none opacity-40"
            : "btn-secondary !py-2 !px-3",
        ].join(" ")}
        style={page === 1 ? {
          background: "var(--surface)",
          border: "1px solid var(--line)",
          color: "var(--ink-3)",
        } : {}}
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
        Anterior
      </Link>

      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-xs" style={{ color: "var(--ink-3)" }}>
              ···
            </span>
          ) : (
            <Link
              key={p}
              href={buildPageHref(p as number)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors"
              style={
                p === page
                  ? { background: "var(--primary)", color: "white" }
                  : { background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)" }
              }
            >
              {p}
            </Link>
          )
        )}
      </div>

      <span className="text-xs sm:hidden" style={{ color: "var(--ink-3)" }}>
        {page} / {totalPages}
      </span>

      <Link
        href={buildPageHref(next)}
        aria-disabled={page === totalPages}
        className={[
          "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
          page === totalPages
            ? "pointer-events-none opacity-40"
            : "btn-secondary !py-2 !px-3",
        ].join(" ")}
        style={page === totalPages ? {
          background: "var(--surface)",
          border: "1px solid var(--line)",
          color: "var(--ink-3)",
        } : {}}
      >
        Siguiente
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
