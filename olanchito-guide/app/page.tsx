import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  ArrowRightIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
  PhoneIcon,
  MapPinIcon,
  SparklesIcon,
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import DeviceMacbookMockup from "@/components/DeviceMacbookMockup";
import FaqSection from "@/components/FaqSection";
import NovedadesSection from "@/components/NovedadesSection";
import AnnouncementsSection from "@/components/AnnouncementsSection";
import QuickFilters from "@/components/QuickFilters";
import { categoryIcon } from "@/lib/categoryIcons";
import { getOpenStatus } from "@/lib/hours";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const pillars = [
  {
    title: "Negocios verificados",
    text: "Información validada para encontrar servicios confiables.",
    Icon: CheckBadgeIcon,
  },
  {
    title: "Contacto directo",
    text: "Llamada, WhatsApp y redes sociales en un solo lugar.",
    Icon: PhoneIcon,
  },
  {
    title: "Ubicación precisa",
    text: "Direcciones y mapas integrados para llegar rápido.",
    Icon: MapPinIcon,
  },
];

export default async function HomePage() {
  const [{ data: businessRows, error: businessError }, { data: categoryRows, error: categoryError }] =
    await Promise.all([
      supabase.from("businesses").select("hours"),
      supabase.from("categories").select("id, name, slug, icon, businesses(count)"),
    ]);

  const totalBusinesses = businessError ? 0 : businessRows?.length ?? 0;
  const openNow = (businessRows ?? []).filter((b) => getOpenStatus(b.hours) === "open").length;

  // Categorías con negocios, de la más poblada a la menos ("Otros" no dice nada como destacada)
  const categoriesWithCount = (categoryError ? [] : categoryRows ?? [])
    .map((c) => ({ ...c, count: (c.businesses as { count: number }[] | null)?.[0]?.count ?? 0 }))
    .filter((c) => c.count > 0);
  const featured = categoriesWithCount
    .filter((c) => c.slug !== "otros")
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
    .slice(0, 8);

  const numberFormatter = new Intl.NumberFormat("es-HN");
  const businessesLabel = numberFormatter.format(totalBusinesses);
  const categoriesLabel = numberFormatter.format(categoriesWithCount.length);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Directorio Olanchito",
    url: "https://olanchito.com",
    description: "Directorio comunitario de negocios y servicios locales en Olanchito, Honduras.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://olanchito.com/negocios?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Directorio Olanchito",
    url: "https://olanchito.com",
    logo: "https://olanchito.com/colibri.webp",
    description: "Directorio comunitario de negocios y servicios locales en Olanchito, Honduras.",
    areaServed: {
      "@type": "City",
      name: "Olanchito",
      addressCountry: "HN",
    },
  };

  return (
    <main className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="hero-home relative overflow-hidden">
        <div aria-hidden className="hero-home-grid pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="hero-home-glow hero-home-glow-left pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full"
        />
        <div
          aria-hidden
          className="hero-home-glow hero-home-glow-right pointer-events-none absolute -right-20 bottom-8 h-72 w-72 rounded-full"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-1/2 hidden -translate-y-1/2 lg:block"
        >
          <Image
            src="/colibri.webp"
            alt=""
            width={620}
            height={620}
            className="hero-home-colibri"
          />
        </div>

        <div className="section-container relative py-14 text-center sm:py-16 lg:py-20">
          <div>
            <div className="hero-home-badge mx-auto mb-4 w-fit">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              Directorio local de Olanchito, Honduras
            </div>

            <h1
              className="mx-auto max-w-4xl text-4xl font-semibold sm:text-[3.15rem] lg:text-[3.75rem]"
              style={{
                fontFamily: "var(--font-syne)",
                letterSpacing: "-0.028em",
                lineHeight: 1.07,
                color: "var(--ink)",
              }}
            >
              Directorio de negocios en Olanchito, Honduras
              <span className="hero-home-highlight block">
                contacto directo y horarios reales
              </span>
            </h1>

            <p
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--ink-2)" }}
            >
              Busque por categoría, compare opciones y contacte por teléfono o WhatsApp en segundos.
              Todo el directorio está pensado para encontrar rápido y con confianza.
            </p>

            {/* Search bar */}
            <form
              action="/negocios"
              method="GET"
              className="mx-auto mt-8 flex w-full max-w-xl items-center gap-2 rounded-2xl p-1.5"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line-strong)",
                boxShadow: "0 8px 24px rgba(10,30,20,0.08)",
              }}
            >
              <input
                name="q"
                type="search"
                aria-label="Buscar negocios"
                placeholder="Farmacia, hotel, mecánico..."
                className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-[var(--ink-3)]"
                style={{ color: "var(--ink)" }}
              />
              <button
                type="submit"
                className="btn-primary !py-2 !px-4 !text-xs flex-shrink-0"
              >
                Buscar
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </form>

            <QuickFilters openNowCount={openNow} />

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Link href="/categorias" className="btn-secondary !text-xs !py-2">
                <Squares2X2Icon className="h-3.5 w-3.5" />
                Ver categorías
              </Link>
              <Link href="/negocios" className="btn-secondary !text-xs !py-2">
                <BuildingStorefrontIcon className="h-3.5 w-3.5" />
                Ver todos los negocios
              </Link>
            </div>

            <div
              className="mx-auto mt-8 grid w-full max-w-3xl gap-3 pt-6 sm:grid-cols-3"
              style={{ borderTop: "1px solid var(--line-strong)" }}
            >
              <article
                className="rounded-2xl px-4 py-3 text-center backdrop-blur-[2px] transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid var(--line)",
                  boxShadow: "0 8px 24px rgba(10,30,20,0.06)",
                }}
              >
                <p className="text-xl font-semibold sm:text-2xl" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                  {businessesLabel}
                </p>
                <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                  Negocios activos
                </p>
              </article>

              <article
                className="rounded-2xl px-4 py-3 text-center backdrop-blur-[2px] transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid var(--line)",
                  boxShadow: "0 8px 24px rgba(10,30,20,0.06)",
                }}
              >
                <p className="text-xl font-semibold sm:text-2xl" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                  {categoriesLabel}
                </p>
                <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                  Categorías con negocios
                </p>
              </article>

              <Link
                href="/negocios?abierto=1"
                className="rounded-2xl px-4 py-3 text-center backdrop-blur-[2px] transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid var(--line)",
                  boxShadow: "0 8px 24px rgba(10,30,20,0.06)",
                }}
              >
                <p className="text-xl font-semibold sm:text-2xl" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                  {numberFormatter.format(openNow)}
                </p>
                <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                  Abiertos en este momento
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PILLARS ─────────────────────────────────────── */}
      <section className="section-container py-12 sm:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map(({ title, text, Icon }, i) => (
            <article
              key={title}
              className={`panel flex items-start gap-4 p-5 animate-fade-up anim-delay-${i + 1}`}
            >
              <div className="icon-box flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}
                >
                  {title}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── FEATURED CATEGORIES ────────────────────────── */}
      <section className="section-container pb-14 sm:pb-16">
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label mb-2">Categorías destacadas</p>
            <h2 className="heading-xl">Explore por tipo de negocio</h2>
          </div>
          <Link
            href="/categorias"
            className="btn-secondary !py-2 !text-xs mt-2 sm:mt-0"
          >
            Ver todas
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map(({ name, slug, icon, count }, i) => {
            const def = categoryIcon(icon);
            return (
            <Link
              key={slug}
              href={`/categorias/${slug}`}
              className={`panel group p-5 transition-all duration-300 hover:-translate-y-1 animate-fade-up anim-delay-${(i % 4) + 1}`}
              style={{ "--tw-shadow": "var(--shadow-md)" } as React.CSSProperties}
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: def.bg, color: def.accent }}
              >
                {def.el}
              </span>

              <div className="mt-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}
                >
                  {name}
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: "var(--ink-3)" }}>
                  {count} negocio{count !== 1 ? "s" : ""}
                </p>
              </div>

              <div
                className="mt-4 flex items-center gap-1 text-xs font-semibold transition-transform group-hover:translate-x-0.5"
                style={{ color: "var(--primary-mid)" }}
              >
                Ver negocios
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </div>
            </Link>
            );
          })}
        </div>
      </section>

      {/* ─── GUÍA PARA VISITANTES ────────────────────────── */}
      <section className="section-container pb-14 sm:pb-16">
        <Link
          href="/visitar-olanchito"
          className="panel group flex flex-col gap-4 p-6 transition-all duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div className="flex items-start gap-4">
            <div className="icon-box flex-shrink-0">
              <MapPinIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label mb-1">¿Viene de visita?</p>
              <h2 className="text-xl font-semibold sm:text-2xl" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.02em" }}>
                Guía para visitar Olanchito
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
                Dónde dormir, dónde comer, cómo moverse y a quién llamar si necesita un médico.
              </p>
            </div>
          </div>
          <span className="btn-primary w-fit !text-xs">
            Ver la guía
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      {/* ─── ANUNCIOS ────────────────────────────────────── */}
      <AnnouncementsSection />

      {/* ─── CTA JOIN ────────────────────────────────────── */}
      <section className="section-container pb-14 sm:pb-16">
        <div
          className="relative overflow-hidden rounded-2xl p-8 sm:p-10"
          style={{
            background: "linear-gradient(135deg, var(--surface-2) 0%, var(--surface) 100%)",
            border: "1px solid var(--line)",
          }}
        >
          {/* Decorative accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="badge-primary mb-3 w-fit">
                <BuildingStorefrontIcon className="h-3.5 w-3.5" />
                Para propietarios
              </div>
              <h3
                className="text-2xl font-bold sm:text-3xl"
                style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
              >
                ¿Tiene un negocio en Olanchito?
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
                Aparezca en el directorio gratis y mejore su visibilidad local. Miles de vecinos buscan aquí.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link href="/registrar" className="btn-primary">
                Registrar negocio
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/negocios" className="btn-secondary">
                Ver directorio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NOVEDADES ───────────────────────────────────── */}
      <NovedadesSection />

      {/* ─── FAQ ─────────────────────────────────────────── */}
      <FaqSection />

      {/* ─── VENNQ COMING SOON ───────────────────────────── */}
      <section className="section-container pb-10 sm:pb-12">
        <div
          className="relative overflow-hidden rounded-xl"
          style={{ background: "var(--primary)" }}
        >
          {/* Mesh accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-10 h-52 w-52 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -bottom-12 h-48 w-48 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
              filter: "blur(48px)",
            }}
          />

          <div className="relative grid items-center gap-5 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,620px)]">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="badge-dark w-fit">
                  <SparklesIcon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                  Próximamente
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Solución para PYMEs
                </span>
              </div>

              <h3
                className="text-2xl font-bold text-white sm:text-[1.9rem]"
                style={{ fontFamily: "var(--font-syne)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
              >
                VennQ para negocios
                <span className="block" style={{ color: "var(--accent)" }}>
                  Ventas, inventario y operación multi-sucursal
                </span>
              </h3>

              <p
                className="mt-2.5 max-w-2xl text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.62)" }}
              >
                Centralice caja, inventario y control diario en una sola plataforma, diseñada para crecer con su negocio.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <a
                  href="https://pre-register.vennq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-white !px-4 !py-2 !text-xs"
                >
                  Solicitar acceso anticipado
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://vennq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost !px-4 !py-2 !text-xs"
                >
                  Conocer VennQ
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="hidden items-center justify-end px-1 md:flex lg:pr-5 xl:pr-6">
              <DeviceMacbookMockup
                className="mqy-macbook-hero w-full max-w-[560px] xl:max-w-[620px]"
                src="/vennq-preview.webp"
                alt="Vista previa de VennQ — Plataforma de operación para PYMEs"
              />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
