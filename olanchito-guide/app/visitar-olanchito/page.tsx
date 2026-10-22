import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import BusinessCard from "@/components/BusinessCard";
import OpenNowBadge from "@/components/OpenNowBadge";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  PhoneIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import { businessImageUrl } from "@/lib/businessImage";

export const revalidate = 300;

const BASE_URL = "https://olanchito.com";
const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";

const TITLE = "Visitar Olanchito: dónde dormir, comer y moverse";
const DESCRIPTION =
  "Guía práctica para visitar Olanchito, Yoro, Honduras: hoteles, restaurantes, transporte, clínicas y farmacias con horario, ubicación y contacto directo por WhatsApp.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/visitar-olanchito` },
  openGraph: {
    title: `${TITLE} | Directorio Olanchito`,
    description: DESCRIPTION,
    url: `${BASE_URL}/visitar-olanchito`,
    siteName: "Directorio Olanchito",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Guía para visitar Olanchito" }],
    locale: "es_HN",
    type: "article",
  },
};

type Section = {
  id: string;
  title: string;
  intro: string;
  slugs: string[];
  limit: number;
  layout: "cards" | "list";
};

// El orden responde a lo que necesita quien llega de fuera: dónde quedarse, comer y moverse
const SECTIONS: Section[] = [
  {
    id: "donde-dormir",
    title: "Dónde dormir",
    intro: "Hoteles y hospedajes de Olanchito. Escriba por WhatsApp para confirmar disponibilidad y tarifa antes de llegar.",
    slugs: ["hoteles-hospedaje"],
    limit: 6,
    layout: "cards",
  },
  {
    id: "donde-comer",
    title: "Dónde comer",
    intro: "Los restaurantes más visitados del directorio, desde comida típica hondureña hasta cafeterías.",
    slugs: ["restaurantes"],
    limit: 6,
    layout: "cards",
  },
  {
    id: "como-moverse",
    title: "Cómo moverse",
    intro: "Taxis y transporte para moverse por la ciudad y viajar a otros municipios.",
    slugs: ["transporte-taxis"],
    limit: 8,
    layout: "list",
  },
  {
    id: "salud",
    title: "Salud y farmacias",
    intro: "Clínicas y farmacias por si las necesita durante su visita.",
    slugs: ["clinicas-salud", "farmacias"],
    limit: 8,
    layout: "list",
  },
  {
    id: "envios",
    title: "Envíos y paquetería",
    intro: "Para enviar o recibir paquetes desde y hacia Olanchito.",
    slugs: ["mensajeria-envios"],
    limit: 8,
    layout: "list",
  },
];

type Row = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  image: string | null;
  description: string | null;
  hours: string | null;
  featured: boolean | null;
  verified: boolean | null;
  view_count: number | null;
  category_id: string | null;
};

export default async function VisitarOlanchitoPage() {
  const allSlugs = SECTIONS.flatMap((s) => s.slugs);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .in("slug", allSlugs);

  const categoryIds = (categories ?? []).map((c) => c.id);
  const [{ data: rows }, { data: reviews }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug, address, image, description, hours, featured, verified, view_count, category_id")
      .in("category_id", categoryIds.length > 0 ? categoryIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("reviews").select("business_slug, rating").eq("is_visible", true),
  ]);

  const stats: Record<string, { sum: number; count: number }> = {};
  for (const r of reviews ?? []) {
    const s = stats[r.business_slug] ?? { sum: 0, count: 0 };
    s.sum += r.rating;
    s.count += 1;
    stats[r.business_slug] = s;
  }

  const sections = SECTIONS.map((section) => {
    const sectionCategories = (categories ?? []).filter((c) => section.slugs.includes(c.slug));
    const ids = new Set(sectionCategories.map((c) => c.id));
    const businesses = ((rows ?? []) as Row[])
      .filter((b) => b.category_id && ids.has(b.category_id))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.view_count ?? 0) - (a.view_count ?? 0));
    return {
      ...section,
      categories: sectionCategories,
      total: businesses.length,
      businesses: businesses.slice(0, section.limit),
      categoryName: (id: string | null) => sectionCategories.find((c) => c.id === id)?.name ?? "",
    };
  }).filter((s) => s.total > 0);

  const hotels = sections.find((s) => s.id === "donde-dormir")?.businesses ?? [];
  const restaurants = sections.find((s) => s.id === "donde-comer")?.businesses ?? [];
  const listNames = (items: Row[]) => items.slice(0, 4).map((b) => b.name).join(", ");

  // Preguntas frecuentes construidas con los datos reales del directorio
  const faq = [
    hotels.length > 0 && {
      q: "¿Dónde hospedarse en Olanchito?",
      a: `En el directorio hay ${hotels.length} opción${hotels.length !== 1 ? "es" : ""} de hospedaje, entre ellas ${listNames(hotels)}. Cada ficha tiene teléfono, WhatsApp y ubicación en el mapa.`,
    },
    restaurants.length > 0 && {
      q: "¿Dónde comer en Olanchito?",
      a: `Algunos de los restaurantes más visitados del directorio son ${listNames(restaurants)}. En /negocios puede filtrar los que están abiertos en este momento.`,
    },
    {
      q: "¿Cómo contacto a un negocio de Olanchito?",
      a: "La mayoría de los negocios atiende por WhatsApp. En cada ficha del directorio hay un botón que abre la conversación con un mensaje listo para enviar.",
    },
    {
      q: "¿Qué moneda se usa en Olanchito?",
      a: "La moneda de Honduras es el lempira (HNL). Muchos negocios pequeños trabajan solo con efectivo, así que conviene preguntar antes si aceptan tarjeta o transferencia.",
    },
  ].filter(Boolean) as { q: string; a: string }[];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Visitar Olanchito", item: `${BASE_URL}/visitar-olanchito` },
    ],
  };

  const tips = [
    {
      Icon: ChatBubbleLeftRightIcon,
      title: "WhatsApp primero",
      text: "Es la forma más rápida de confirmar horarios, precios y disponibilidad.",
    },
    {
      Icon: BanknotesIcon,
      title: "Lleve efectivo",
      text: "La moneda es el lempira (HNL) y no todos los negocios aceptan tarjeta.",
    },
    {
      Icon: PhoneIcon,
      title: "Código +504",
      text: "Para llamar desde fuera de Honduras, marque +504 antes del número.",
    },
  ];

  return (
    <main className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* ─── HEADER ─────────────────────────────── */}
      <section className="section-container pt-10 pb-8 sm:pt-12">
        <div className="max-w-3xl">
          <div className="badge-primary mb-3 w-fit">
            <BookOpenIcon className="h-3.5 w-3.5" />
            Guía para visitantes
          </div>
          <h1
            className="text-3xl font-bold sm:text-5xl"
            style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1.08 }}
          >
            Visitar Olanchito
            <span className="block" style={{ color: "var(--primary-mid)" }}>
              dónde dormir, comer y moverse
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Olanchito es una ciudad del departamento de Yoro, en el valle del Aguán. Si viene por trabajo, de visita
            familiar o de paso, aquí tiene los negocios que necesita, con horario, ubicación y contacto directo.
          </p>

          {/* Índice */}
          <nav aria-label="Secciones de la guía" className="mt-6 flex flex-wrap gap-2">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="filter-pill">
                {s.title}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {tips.map(({ Icon, title, text }) => (
            <div key={title} className="panel flex items-start gap-3 p-4">
              <div className="icon-box flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                  {title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECCIONES ──────────────────────────── */}
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="section-container scroll-mt-24 pb-14">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="heading-xl">{section.title}</h2>
              <p className="mt-1.5 text-sm" style={{ color: "var(--ink-2)" }}>{section.intro}</p>
            </div>
            {section.categories.length === 1 && (
              <Link href={`/categorias/${section.categories[0].slug}`} className="btn-secondary !py-2 !text-xs w-fit">
                Ver {section.total > section.businesses.length ? `los ${section.total}` : "categoría"}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {section.layout === "cards" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.businesses.map((b) => {
                const s = stats[b.slug];
                return (
                  <BusinessCard
                    key={b.id}
                    headingLevel={3}
                    business={{
                      name: b.name,
                      slug: b.slug,
                      image: businessImageUrl(b.image, b.slug),
                      address: b.address ?? "",
                      description: b.description ?? "",
                      category: section.categoryName(b.category_id),
                      featured: b.featured ?? false,
                      verified: b.verified ?? false,
                      avgRating: s && s.count > 0 ? s.sum / s.count : undefined,
                      reviewCount: s?.count ?? 0,
                      hours: b.hours,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <ul className="panel divide-y overflow-hidden" style={{ borderColor: "var(--line)" }}>
              {section.businesses.map((b) => (
                <li key={b.id} style={{ borderColor: "var(--line)" }}>
                  <Link
                    href={`/negocios/${b.slug}`}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[var(--surface-2)] sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>{b.name}</p>
                      <p className="mt-0.5 truncate text-xs" style={{ color: "var(--ink-3)" }}>
                        {section.categories.length > 1 ? `${section.categoryName(b.category_id)} · ` : ""}
                        {b.address || "Olanchito"}
                      </p>
                    </div>
                    <OpenNowBadge hours={b.hours} size="sm" />
                    <ArrowRightIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--ink-3)" }} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* ─── FAQ ────────────────────────────────── */}
      <section className="section-container pb-14">
        <h2 className="heading-xl mb-5">Preguntas frecuentes</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {faq.map((f) => (
            <div key={f.q} className="panel p-5">
              <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────── */}
      <section className="section-container pb-16">
        <div className="panel flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
              ¿Busca algo más?
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
              Vea todos los negocios en el mapa o filtre los que están abiertos ahora.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/negocios?view=map" className="btn-secondary">
              <MapIcon className="h-4 w-4" />
              Ver mapa
            </Link>
            <Link href="/negocios?abierto=1" className="btn-primary">
              Abiertos ahora
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
