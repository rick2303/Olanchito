import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ReviewSection from "@/components/reviews/ReviewSection";
import ContactButtons from "@/components/ContactButtons";
import OpenNowBadge from "@/components/OpenNowBadge";
import ViewTracker from "@/components/ViewTracker";
import RelatedBusinesses from "@/components/RelatedBusinesses";
import SuggestCorrection from "@/components/SuggestCorrection";
import {
  ArrowLeftIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  TagIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await supabase.from("businesses").select("slug");
  return (data ?? []).map(({ slug }) => ({ slug }));
}

const BASE_URL = "https://olanchito.com";
const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";
const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

type Props = {
  params: { slug: string };
};

function getImageUrl(path: string | null | undefined): string {
  if (!path) return FALLBACK_IMAGE;
  const cleanPath = path.startsWith("business/") ? path : `business/${path}`;
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath).data.publicUrl ?? FALLBACK_IMAGE;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("businesses")
    .select("name, description, image, slug, address, hours")
    .eq("slug", params.slug)
    .single();

  if (!data) {
    return { title: "Negocio no encontrado | Directorio Olanchito" };
  }

  const title = `${data.name} | Directorio Olanchito`;
  const rawDesc = data.description?.trim();
  const description = rawDesc
    ? rawDesc.length > 155 ? `${rawDesc.slice(0, 152)}…` : rawDesc
    : `Encuentra información de contacto, horario y ubicación de ${data.name} en Olanchito, Honduras.`;

  const imageUrl = getImageUrl(data.image);
  const canonical = `${BASE_URL}/negocios/${data.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Directorio Olanchito",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: data.name }],
      locale: "es_HN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

function normalizeUrl(url?: string | null) {
  if (!url) return "";
  const u = url.trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

function normalizePhone(raw?: string | null) {
  if (!raw) return "";
  return raw.replace(/[^\d+]/g, "");
}

function buildWhatsAppLink(raw?: string | null) {
  const digits = (raw ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  const withCountry = digits.startsWith("504") ? digits : `504${digits}`;
  return `https://wa.me/${withCountry}`;
}

export default async function BusinessDetail({ params }: Props) {
  const { slug } = params;

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      description,
      phone,
      whatsapp,
      address,
      hours,
      services,
      image,
      socials,
      location,
      category_id,
      verified
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("Error cargando negocio:", error);
    return (
      <main className="min-h-screen bg-jungle-50">
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-white p-8 ring-1 ring-black/5">
            <p className="text-sm font-semibold text-jungle-700">
              Negocio no encontrado
            </p>
            <Link
              href="/businesses"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-jungle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-jungle-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Volver a negocios
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const imageUrl = getImageUrl(data.image);

  // Categoria
  let category: { name: string; slug: string } | null = null;
  if (data.category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", data.category_id)
      .single();
    category = cat ?? null;
  }

  // Reviews
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("id, author_name, rating, comment, created_at")
    .eq("business_slug", data.slug)
    .order("created_at", { ascending: false });

  const initialReviews = reviewsData ?? [];

  const socials = (data.socials as Record<string, string> | null) ?? null;
  const location =
    (data.location as { lat?: number; lng?: number } | null) ?? null;

  const phone = normalizePhone(data.phone ?? "");
  const waLink = buildWhatsAppLink(data.whatsapp ?? "");
  const web = normalizeUrl(socials?.website);
  const ig  = normalizeUrl(socials?.instagram);
  const fb  = normalizeUrl(socials?.facebook);
  const li  = normalizeUrl(socials?.linkedin);
  const tt  = normalizeUrl(socials?.tiktok);

  const hasMap = Boolean(location?.lat && location?.lng);
  const services = Array.isArray(data.services)
    ? (data.services as string[]).filter(Boolean)
    : [];

  // JSON-LD
  const avgRating = initialReviews.length > 0
    ? (initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length).toFixed(1)
    : null;

  const phoneForSchema = phone
    ? (phone.startsWith("+") ? phone : `+504${phone}`)
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    ...(data.description && { description: data.description }),
    ...(imageUrl !== FALLBACK_IMAGE && { image: imageUrl }),
    ...(phoneForSchema && { telephone: phoneForSchema }),
    url: `https://olanchito.com/negocios/${data.slug}`,
    address: {
      "@type": "PostalAddress",
      ...(data.address && { streetAddress: data.address }),
      addressLocality: "Olanchito",
      addressRegion: "Yoro",
      addressCountry: "HN",
    },
    ...(location?.lat && location?.lng && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: location.lat,
        longitude: location.lng,
      },
    }),
    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: initialReviews.length,
      },
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio",   item: "https://olanchito.com" },
      { "@type": "ListItem", position: 2, name: "Negocios", item: "https://olanchito.com/businesses" },
      ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: `https://olanchito.com/businesses?category=${category.slug}` },
                      { "@type": "ListItem", position: 4, name: data.name,     item: `https://olanchito.com/negocios/${data.slug}` }]
                   : [{ "@type": "ListItem", position: 3, name: data.name,     item: `https://olanchito.com/negocios/${data.slug}` }]),
    ],
  };

  // Chips con contraste fijo en desktop
  const pillBase =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold";

  const pillMobile =
    "bg-jungle-50 text-jungle-900 ring-1 ring-jungle-200 hover:bg-jungle-100";

  const pillDesktop =
    "lg:bg-black/50 lg:text-white lg:ring-1 lg:ring-white/25 lg:shadow-[0_10px_30px_rgba(0,0,0,0.28)] lg:backdrop-blur";

  return (
    <main className="min-h-screen bg-jungle-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ViewTracker slug={data.slug} />

      {/* HERO (mobile-first) */}
      <section className="relative">
        {/* Imagen */}
        <div className="relative w-full overflow-hidden">
          <div className="relative h-[280px] sm:h-[360px] lg:h-[420px] bg-jungle-950/10">
            {/* Fondo blur */}
            <Image
              src={imageUrl}
              alt=""
              fill
              priority={false}
              sizes="100vw"
              className="object-cover object-center blur-2xl scale-110 opacity-60"
            />

            {/* capa oscura */}
            <div className="absolute inset-0 bg-gradient-to-t from-jungle-950/75 via-jungle-950/25 to-transparent" />
            <div className="absolute inset-0 lg:bg-[radial-gradient(70%_55%_at_50%_0%,rgba(0,0,0,0.22),transparent_60%)]" />

            {/* frente: contain */}
            <div className="absolute inset-0">
              <div className="relative h-full w-full px-4 py-6 sm:px-8 lg:px-10">
                <Image
                  src={imageUrl}
                  alt={data.name}
                  fill
                  priority={false}
                  sizes="100vw"
                  className="object-contain object-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky mobile bar */}
        <div className="sticky top-16 z-40 border-b border-jungle-200/60 bg-jungle-50/85 backdrop-blur lg:hidden">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/businesses"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-jungle-900 ring-1 ring-black/10 hover:bg-jungle-50"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver
              </Link>

              <div className="flex items-center gap-2">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-jungle-900 ring-1 ring-black/10 hover:bg-jungle-50"
                  >
                    <PhoneIcon className="h-4 w-4 text-jungle-700" />
                    Llamar
                  </a>
                ) : null}

                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay info */}
        <div className="lg:absolute lg:inset-x-0 lg:bottom-0">
          <div className="mx-auto max-w-5xl px-4 pb-6 pt-5 sm:px-6 lg:pt-0 lg:pb-6">
            <div className="hidden lg:block">
              <Link
                href="/businesses"
                className="inline-flex items-center gap-2 rounded-2xl bg-black/45 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/55"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Volver a negocios
              </Link>
            </div>

            <div className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-6 lg:mt-5 lg:bg-transparent lg:p-0 lg:ring-0 lg:shadow-none">
              {/* pills */}
              <div className="flex flex-wrap items-center gap-2">
                {category?.name ? (
                  <Link
                    href={`/businesses?category=${category.slug}&page=1`}
                    className={[pillBase, pillMobile, pillDesktop].join(" ")}
                  >
                    <TagIcon className="h-4 w-4" />
                    {category.name}
                  </Link>
                ) : null}

                {data.verified && (
                  <span className={[pillBase, pillMobile, pillDesktop].join(" ")}>
                    <CheckBadgeIcon className="h-4 w-4" />
                    Verificado
                  </span>
                )}

                {data.hours ? (
                  <>
                  <span className={[pillBase, pillMobile, pillDesktop].join(" ")}>
                    <ClockIcon className="h-4 w-4" />
                    {data.hours}
                  </span>
                  <OpenNowBadge hours={data.hours} />
                  </>
                ) : null}
              </div>

              <h1 className="mt-3 text-2xl font-bold text-jungle-950 sm:text-3xl lg:text-4xl lg:text-white">
                {data.name}
              </h1>

              {/* Direccion en hero */}
              {data.address ? (
                <div className="mt-2 inline-flex items-start gap-2 text-sm font-semibold text-jungle-700 lg:text-white/90">
                  <MapPinIcon className="h-5 w-5 mt-0.5" />
                  <span className="line-clamp-2 lg:line-clamp-1">
                    {data.address}
                  </span>
                </div>
              ) : null}

              <div className="mt-4 hidden lg:flex flex-wrap gap-2">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-black/45 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/55"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    Llamar
                  </a>
                ) : null}

                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    WhatsApp
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 opacity-90" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 lg:pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-7">
            {/* Descripcion */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-jungle-700" />
                </div>
                <h2 className="text-lg font-bold text-jungle-950">Descripcion</h2>
              </div>

              {data.description ? (
                <p className="mt-4 text-sm leading-relaxed text-jungle-800 sm:text-base">
                  {data.description}
                </p>
              ) : (
                <p className="mt-4 text-sm text-jungle-700/70 italic">
                  Sin descripcion disponible.
                </p>
              )}
            </div>

            {/* Servicios */}
            {services.length > 0 ? (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-jungle-700" />
                  </div>
                  <h2 className="text-lg font-bold text-jungle-950">Servicios</h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {services.map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="inline-flex items-center rounded-full bg-jungle-50 px-3 py-1 text-xs font-semibold text-jungle-900 ring-1 ring-jungle-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Ubicacion */}
            {hasMap ? (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                    <MapPinIcon className="h-5 w-5 text-jungle-700" />
                  </div>
                  <h2 className="text-lg font-bold text-jungle-950">Ubicacion</h2>
                </div>

                {/* Direccion ANTES del mapa */}
                {data.address ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-jungle-50 px-4 py-3 ring-1 ring-jungle-200">
                    <MapPinIcon className="h-5 w-5 text-jungle-700 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-jungle-900">Direccion</p>
                      <p className="text-sm font-semibold text-jungle-800 line-clamp-3">
                        {data.address}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-black/10">
                  <div className="relative aspect-[16/12] w-full sm:aspect-[16/10]">
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${location!.lat},${location!.lng}&z=15&output=embed`}
                      title="Mapa"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <a
                    href={`https://www.google.com/maps?q=${location!.lat},${location!.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-semibold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50 sm:w-auto"
                  >
                    Abrir en Maps
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : null}

            {/* Reseñas */}
            <ReviewSection businessSlug={data.slug} initialReviews={initialReviews} />
          </div>

          <aside className="space-y-6">
            {/* Contacto (sin direccion) */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
              <h3 className="text-base font-bold text-jungle-950">Contacto</h3>

              <div className="mt-4 space-y-3">
                {data.hours ? (
                  <div className="flex items-start gap-3 rounded-2xl bg-jungle-50 px-4 py-3 ring-1 ring-jungle-200">
                    <ClockIcon className="h-5 w-5 text-jungle-700 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-jungle-900">Horario</p>
                      <p className="text-sm font-semibold text-jungle-800">{data.hours}</p>
                    </div>
                  </div>
                ) : null}

                <ContactButtons
                  phone={phone}
                  waLink={waLink}
                  businessName={data.name}
                />
              </div>
            </div>

            {/* Compartir */}
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 text-sm font-bold text-jungle-950">Compartir</h3>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Mirá este negocio en Olanchito: ${data.name} 👉 https://olanchito.com/negocios/${data.slug}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#20bb5a] transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Compartir en WhatsApp
              </a>
            </div>

            {/* Enlaces */}
            {(ig || fb || li || tt || web) && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <h3 className="text-base font-bold text-jungle-950">Redes y enlaces</h3>
                <div className="mt-4 grid gap-2">
                  {ig && (
                    <SocialLink href={ig} label="Instagram" icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    } />
                  )}
                  {fb && (
                    <SocialLink href={fb} label="Facebook" icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    } />
                  )}
                  {li && (
                    <SocialLink href={li} label="LinkedIn" icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    } />
                  )}
                  {tt && (
                    <SocialLink href={tt} label="TikTok" icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    } />
                  )}
                  {web && (
                    <SocialLink href={web} label="Sitio web" icon={<GlobeAltIcon className="h-4 w-4" />} />
                  )}
                </div>
              </div>
            )}
            {/* Sugerir corrección */}
            <SuggestCorrection businessSlug={data.slug} businessName={data.name} />
          </aside>
        </div>
      </section>

      {/* Negocios relacionados */}
      {data.category_id && category && (
        <RelatedBusinesses
          categoryId={data.category_id}
          currentSlug={data.slug}
          categoryName={category.name}
        />
      )}
    </main>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50 transition-colors"
    >
      <span className="inline-flex items-center gap-2.5">
        <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200 text-jungle-700">
          {icon}
        </span>
        {label}
      </span>
      <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0 text-jungle-400" />
    </a>
  );
}
