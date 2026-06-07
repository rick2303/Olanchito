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

export const revalidate = 300;

const BASE_URL = "https://olanchito.com";
const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";
const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

const categoryDescriptions: Record<string, string> = {
  restaurantes:
    "Descubre los mejores restaurantes, comedores y cafeterías de Olanchito, Honduras. Consulta menús, horarios y contacta directamente.",
  ferreterias:
    "Encuentra ferreterías en Olanchito, Honduras con materiales de construcción, herramientas y productos para el hogar. Horarios, teléfonos y ubicaciones actualizadas.",
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
  "repuestos-talleres":
    "Talleres mecánicos y repuestos en Olanchito, Yoro, Honduras. Encuentra talleres de confianza con horarios, direcciones y contacto por WhatsApp.",
  "hoteles-hospedaje":
    "Hoteles y hospedajes en Olanchito, Honduras para viajeros y visitantes del Valle del Aguán. Información de precios, ubicación y contacto directo.",
};

// Longer body text shown on the category page (150–200 words) for priority categories
const categoryLongDescriptions: Record<string, string> = {
  restaurantes:
    "Descubre los restaurantes, comedores y cafeterías de Olanchito, Honduras en el directorio local más completo de la Ciudad Cívica. Aquí encontrarás opciones para todos los gustos: desde platos típicos hondureños hasta comedores económicos para el almuerzo diario. Consulta los horarios de atención, números de teléfono y contacta directamente por WhatsApp a cada establecimiento. El directorio incluye restaurantes en el centro de Olanchito y sus alrededores, con reseñas reales de clientes y ubicaciones en el mapa interactivo. Ya sea que estés buscando dónde comer en familia, con amigos o durante una visita de negocios, encontrarás todas las opciones de gastronomía local de Olanchito, Yoro en un solo lugar. Actualizado regularmente para reflejar horarios reales y nueva información de contacto.",
  ferreterias:
    "Ferreterías en Olanchito, Honduras con materiales de construcción, herramientas y productos para el hogar. Consulta horarios, ubicación y contacta directamente a las ferreterías de Olanchito, Yoro. Todo el directorio ferretero de la Ciudad Cívica en un solo lugar. Aquí encontrarás distribuidores de cemento, varillas, blocks, pintura, plomería y electricidad. Ya sea que estés construyendo, remodelando o haciendo reparaciones menores en tu hogar o negocio, las ferreterías de Olanchito cuentan con todo lo que necesitas. El directorio te permite comparar opciones, ver ubicaciones en el mapa y contactar directamente por teléfono o WhatsApp. Información actualizada con horarios reales de atención.",
  farmacias:
    "Farmacias en Olanchito, Yoro, Honduras con medicamentos, productos de salud y artículos de cuidado personal. El directorio local reúne todas las farmacias activas de Olanchito para que encuentres la más cercana o la que mejor se adapte a tus necesidades. Consulta horarios de atención, números de teléfono y ubicaciones actualizadas de cada farmacia. Algunas farmacias en Olanchito ofrecen servicio a domicilio o turno nocturno — revisa los detalles de cada establecimiento. También encontrarás farmacias con laboratorio clínico, venta de insumos médicos y productos veterinarios. Todo el directorio farmacéutico de la Ciudad Cívica de Honduras en un solo lugar, con información verificada y reseñas de clientes reales.",
  "hoteles-hospedaje":
    "Hoteles y hospedajes en Olanchito, Honduras para viajeros y visitantes del Valle del Aguán. El directorio incluye opciones de alojamiento en Olanchito, Yoro, con información de precios, ubicación y contacto directo. Si buscás dónde quedarte en Olanchito durante tu visita o estadía laboral, encontrá aquí las opciones de alojamiento con contacto directo, precios y ubicaciones en el Valle del Aguán. Desde hoteles con todas las comodidades hasta hospedajes económicos, el directorio de Olanchito reúne las mejores alternativas de alojamiento de la Ciudad Cívica. Consulta disponibilidad, tarifa y contacta directamente por teléfono o WhatsApp a cada establecimiento.",
  talleres:
    "Talleres mecánicos y repuestos en Olanchito, Yoro, Honduras. Encuentra talleres de confianza para tu vehículo en la Ciudad Cívica con horarios, direcciones y contacto por WhatsApp. El directorio local reúne los principales talleres mecánicos y distribuidores de repuestos de Olanchito y sus alrededores. Ya sea que necesites mantenimiento preventivo, reparación de motor, frenos, suspensión o electricidad automotriz, aquí encontrarás el taller indicado. También incluye vulcanizadoras, alineación y balanceo, y tiendas de repuestos originales y alternativos. Contacta directamente a los talleres de Olanchito con información actualizada.",
  "repuestos-talleres":
    "Talleres mecánicos y repuestos en Olanchito, Yoro, Honduras. Encuentra talleres de confianza para tu vehículo en la Ciudad Cívica con horarios, direcciones y contacto por WhatsApp. El directorio local reúne los principales talleres mecánicos y distribuidores de repuestos de Olanchito y sus alrededores. Ya sea que necesites mantenimiento preventivo, reparación de motor, frenos, suspensión o electricidad automotriz, aquí encontrarás el taller indicado. También incluye vulcanizadoras, alineación y balanceo, y tiendas de repuestos originales y alternativos. Contacta directamente a los talleres de Olanchito con información actualizada.",
};

function getCategoryDescription(slug: string, name: string): string {
  return (
    categoryDescriptions[slug] ??
    `Encuentra los mejores negocios de ${name} en Olanchito, Honduras. Información de contacto, horarios, ubicación y reseñas de clientes reales.`
  );
}

function getCategoryLongDescription(slug: string): string | null {
  return categoryLongDescriptions[slug] ?? null;
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
    alternates: { canonical: `${BASE_URL}/categorias/${cat.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/categorias/${cat.slug}`,
      siteName: "Directorio Olanchito",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      locale: "es_HN",
      type: "website",
    },
  };
}

export default async function CategoriaPage({
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
    .select("id, name, slug, address, image, description, featured, verified, view_count, created_at")
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
  const longDescription = getCategoryLongDescription(category.slug);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Categorías", item: `${BASE_URL}/categorias` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${BASE_URL}/categorias/${category.slug}` },
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
          href="/categorias"
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
        {longDescription && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
            {longDescription}
          </p>
        )}
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
            <Link href="/registrar" className="btn-primary mt-5 inline-flex !text-xs !py-2">
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
                    verified: b.verified ?? false,
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
              <Link href="/registrar" className="btn-primary mt-4 inline-flex !text-xs !py-2">
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
