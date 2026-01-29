// app/businesses/page.tsx
import { supabase } from "@/lib/supabase";
import BusinessCard from "@/components/BusinessCard";
import BusinessFilters from "@/components/BusinessFilters";
import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Negocios | Directorio Olanchito",
  description: "Explora todos los negocios registrados en el directorio de Olanchito.",
};

type Props = {
  searchParams?: { category?: string; q?: string; page?: string };
};

const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";

const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

const PAGE_SIZE = 12;

export default async function BusinessesPage({ searchParams }: Props) {
  cookies();

  const categorySlug = (searchParams?.category ?? "").toLowerCase().trim();
  const q = (searchParams?.q ?? "").trim();
  const page = Math.max(parseInt(searchParams?.page ?? "1", 10) || 1, 1);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  // Resolver category_id si viene slug
  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  // Query base (filtra en BD)
  let query = supabase
    .from("businesses")
    .select("id, name, slug, category_id, address, image, description", { count: "exact" })
    .order("name", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (q) query = query.ilike("name", `%${q}%`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error cargando negocios:", error);
    return (
      <main className="min-h-screen bg-jungle-50 py-10">
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="rounded-2xl bg-white p-5 text-jungle-800 ring-1 ring-black/5">
            Error cargando negocios.
          </p>
        </section>
      </main>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  // Public URLs
  const businesses =
    (data ?? []).map((b) => {
      let imageUrl = FALLBACK_IMAGE;

      if (b.image && typeof b.image === "string") {
        const cleanPath = b.image.startsWith("business/") ? b.image : `business/${b.image}`;
        const { data: imgData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath);
        imageUrl = imgData?.publicUrl ?? FALLBACK_IMAGE;
      }

      return { ...b, image: imageUrl };
    }) ?? [];

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/businesses?${params.toString()}`;
  };

  const currentTitle = categorySlug ? `Negocios: ${categorySlug.replaceAll("-", " ")}` : "Negocios";

  return (
    <main className="min-h-screen bg-jungle-50">
      {/*Header ULTRA compacto (nada fijo, nada grande) */}
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-jungle-950 capitalize">
              {currentTitle}
            </h1>
            <p className="mt-0.5 text-[11px] sm:text-xs text-jungle-700/90">
              {total > 0 ? `${total} resultados` : "Sin resultados"} · Página {page} de {totalPages}
            </p>
          </div>

          {/*Esto NO debe ocupar toda la pantalla: lo envolvemos y alineamos a la derecha */}
          <div className="sm:ml-auto w-full sm:w-auto">
            <div className="inline-flex w-full sm:w-auto justify-end">
              <BusinessFilters categories={categories ?? []} />
            </div>
          </div>
        </div>

        {/* separador suave y pequeño */}
        <div className="mt-3 h-px w-full bg-jungle-200/70" />
      </section>

      {/* Contenido */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {businesses.length === 0 ? (
          <div className="rounded-3xl bg-white p-7 ring-1 ring-black/5">
            <p className="text-sm font-semibold text-jungle-800">No hay negocios con esos filtros.</p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/businesses"
                className="inline-flex items-center gap-2 rounded-2xl bg-jungle-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-jungle-700 transition"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Ver todos
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* paginación ARRIBA (más compacta) */}
            <PaginationBar page={page} totalPages={totalPages} buildPageHref={buildPageHref} />

            {/*grid más “apretado” para que se vean más negocios */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={{
                    name: business.name,
                    slug: business.slug,
                    image: business.image,
                    address: business.address ?? "",
                    description: business.description ?? "",
                  }}
                />
              ))}
            </div>

            {/* paginación ABAJO */}
            <PaginationBar page={page} totalPages={totalPages} buildPageHref={buildPageHref} />
          </>
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
  const prev = Math.max(page - 1, 1);
  const next = Math.min(page + 1, totalPages);

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Link
          href={buildPageHref(prev)}
          aria-disabled={page === 1}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-extrabold ring-1 transition",
            page === 1
              ? "pointer-events-none bg-white/70 text-jungle-700/50 ring-black/5"
              : "bg-white text-jungle-900 ring-black/5 hover:bg-jungle-50",
          ].join(" ")}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Anterior
        </Link>

        <span className="text-[11px] font-semibold text-jungle-700">
          <span className="font-extrabold text-jungle-950">{page}</span> /{" "}
          <span className="font-extrabold text-jungle-950">{totalPages}</span>
        </span>

        <Link
          href={buildPageHref(next)}
          aria-disabled={page === totalPages}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-extrabold ring-1 transition",
            page === totalPages
              ? "pointer-events-none bg-white/70 text-jungle-700/50 ring-black/5"
              : "bg-white text-jungle-900 ring-black/5 hover:bg-jungle-50",
          ].join(" ")}
        >
          Siguiente
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
          const start = Math.max(1, Math.min(page - 3, totalPages - 6));
          const p = start + i;
          if (p > totalPages) return null;

          return (
            <Link
              key={p}
              href={buildPageHref(p)}
              className={[
                "h-8 w-8 grid place-items-center rounded-2xl text-[11px] font-extrabold ring-1 transition",
                p === page
                  ? "bg-jungle-600 text-white ring-jungle-600"
                  : "bg-white text-jungle-900 ring-black/5 hover:bg-jungle-50",
              ].join(" ")}
            >
              {p}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
