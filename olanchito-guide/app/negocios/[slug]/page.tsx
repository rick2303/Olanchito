import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ReviewSection from "@/components/reviews/ReviewSection";
import GalleryLightbox from "@/components/GalleryLightbox";
import CatalogGrid from "@/components/CatalogGrid";
import ContactButtons from "@/components/ContactButtons";
import TrackingLink from "@/components/TrackingLink";
import OpenNowBadge from "@/components/OpenNowBadge";
import ViewTracker from "@/components/ViewTracker";
import RelatedBusinesses from "@/components/RelatedBusinesses";
import SuggestCorrection from "@/components/SuggestCorrection";
import ShareButtons from "@/components/ShareButtons";
import BusinessQR from "@/components/BusinessQR";
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
  BookOpenIcon,
  PhotoIcon,
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

  const title = `${data.name} en Olanchito | Directorio Olanchito`;
  const rawDesc = data.description?.trim();
  const description = rawDesc
    ? rawDesc.length > 155 ? `${rawDesc.slice(0, 152)}…` : rawDesc
    : `${data.name} en Olanchito, Honduras. Encuentra teléfono, dirección, horario y reseñas de clientes en el Directorio Olanchito.`;

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
      verified,
      subscription_active,
      subscription_tier,
      booking_url,
      announcement,
      announcement_expires_at
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
              href="/negocios"
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
    .select("id, author_name, rating, comment, created_at, owner_reply")
    .eq("business_slug", data.slug)
    .order("created_at", { ascending: false });

  const initialReviews = reviewsData ?? [];

  // Gallery photos (only if business has active subscription)
  const galleryPhotos: { id: string; image_path: string }[] = [];
  if ((data as { subscription_active?: boolean }).subscription_active) {
    const { data: photosData } = await supabase
      .from("business_photos")
      .select("id, image_path")
      .eq("business_id", data.id)
      .order("sort_order", { ascending: true });
    if (photosData) galleryPhotos.push(...photosData);
  }

  // Catalog items (only if business has active subscription)
  const catalogItems: { id: string; name: string; description: string | null; price: string | null; currency: string; image_path: string | null }[] = [];
  if ((data as { subscription_active?: boolean }).subscription_active) {
    const { data: catalogData } = await supabase
      .from("catalog_items")
      .select("id, name, description, price, currency, image_path")
      .eq("business_id", data.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (catalogData) catalogItems.push(...catalogData);
  }

  // Offers (featured plan only)
  type OfferRow = { id: string; title: string; description: string | null; original_price: string | null; sale_price: string | null; currency: string; badge: string | null; expires_at: string | null };
  const offers: OfferRow[] = [];
  if ((data as { subscription_tier?: string }).subscription_tier === "featured") {
    const today = new Date().toISOString().split("T")[0];
    const { data: offersData } = await supabase
      .from("offers")
      .select("id, title, description, original_price, sale_price, currency, badge, expires_at")
      .eq("business_id", data.id)
      .eq("active", true)
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order("sort_order", { ascending: true });
    if (offersData) offers.push(...offersData);
  }

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

  // Announcement — only show if not expired
  const announcementText = (() => {
    const raw = (data as { announcement?: string | null }).announcement;
    const exp = (data as { announcement_expires_at?: string | null }).announcement_expires_at;
    if (!raw) return null;
    if (exp && new Date(exp) < new Date()) return null;
    return raw;
  })();

  const bookingUrl = normalizeUrl((data as { booking_url?: string | null }).booking_url);
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
      { "@type": "ListItem", position: 2, name: "Negocios", item: "https://olanchito.com/negocios" },
      ...(category
        ? [
            { "@type": "ListItem", position: 3, name: category.name, item: `https://olanchito.com/categorias/${category.slug}` },
            { "@type": "ListItem", position: 4, name: data.name,     item: `https://olanchito.com/negocios/${data.slug}` },
          ]
        : [{ "@type": "ListItem", position: 3, name: data.name, item: `https://olanchito.com/negocios/${data.slug}` }]),
    ],
  };

  const reviewsJsonLd = initialReviews.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    url: `https://olanchito.com/negocios/${data.slug}`,
    review: initialReviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author_name ?? "Cliente" },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      ...(r.comment && { reviewBody: r.comment }),
    })),
  } : null;

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
      {reviewsJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsJsonLd) }} />
      )}
      <ViewTracker slug={data.slug} />

      {/* ─── ANNOUNCEMENT BANNER ─── */}
      {announcementText && (
        <div className="bg-amber-500">
          <div className="mx-auto max-w-5xl px-4 py-2.5 sm:px-6">
            <p className="text-center text-xs font-semibold text-white sm:text-sm">
              📢 {announcementText}
            </p>
          </div>
        </div>
      )}

      {/* ─── BREADCRUMBS ─── */}
      <nav
        aria-label="Breadcrumb"
        className="section-container py-3 hidden sm:block"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <ol className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-3)" }}>
          <li><Link href="/" style={{ color: "var(--ink-3)" }} className="hover:underline">Inicio</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/negocios" style={{ color: "var(--ink-3)" }} className="hover:underline">Negocios</Link></li>
          {category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/categorias/${category.slug}`} style={{ color: "var(--ink-3)" }} className="hover:underline">
                  {category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li className="font-semibold truncate max-w-[200px]" style={{ color: "var(--ink-2)" }} aria-current="page">
            {data.name}
          </li>
        </ol>
      </nav>

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
                href="/negocios"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-jungle-900 ring-1 ring-black/10 hover:bg-jungle-50"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver
              </Link>

              <div className="flex items-center gap-2">
                {phone ? (
                  <TrackingLink
                    href={`tel:${phone}`}
                    businessId={data.id}
                    eventType="phone_click"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-jungle-900 ring-1 ring-black/10 hover:bg-jungle-50"
                  >
                    <PhoneIcon className="h-4 w-4 text-jungle-700" />
                    Llamar
                  </TrackingLink>
                ) : null}

                {waLink ? (
                  <TrackingLink
                    href={waLink}
                    businessId={data.id}
                    eventType="whatsapp_click"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    WhatsApp
                  </TrackingLink>
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
                href="/negocios"
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
                    href={`/negocios?category=${category.slug}&page=1`}
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
                  <TrackingLink
                    href={`tel:${phone}`}
                    businessId={data.id}
                    eventType="phone_click"
                    className="inline-flex items-center gap-2 rounded-2xl bg-black/45 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/55"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    Llamar
                  </TrackingLink>
                ) : null}

                {waLink ? (
                  <TrackingLink
                    href={waLink}
                    businessId={data.id}
                    eventType="whatsapp_click"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    WhatsApp
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 opacity-90" />
                  </TrackingLink>
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

            {/* Galería de fotos */}
            {galleryPhotos.length > 0 && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <div className="flex items-center gap-2 mb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                    <PhotoIcon className="h-5 w-5 text-jungle-700" />
                  </div>
                  <h2 className="text-lg font-bold text-jungle-950">Galería</h2>
                </div>
                <GalleryLightbox
                  photos={galleryPhotos.map(p => ({
                    id: p.id,
                    url: supabase.storage.from(BUCKET_NAME).getPublicUrl(p.image_path).data.publicUrl,
                  }))}
                />
              </div>
            )}

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

            {/* Catálogo */}
            {catalogItems.length > 0 && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                    <BookOpenIcon className="h-5 w-5 text-jungle-700" />
                  </div>
                  <h2 className="text-lg font-bold text-jungle-950">Catálogo</h2>
                </div>
                <CatalogGrid
                  items={catalogItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    currency: item.currency,
                    imgUrl: item.image_path
                      ? supabase.storage.from(BUCKET_NAME).getPublicUrl(item.image_path).data.publicUrl
                      : null,
                  }))}
                />
              </div>
            )}

            {/* Ofertas y Promociones */}
            {offers.length > 0 && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <div className="flex items-center gap-2 mb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
                    <TagIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-bold text-jungle-950">Ofertas y Promociones</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offers.map(offer => {
                    const cur = offer.currency ?? "HNL";
                    const fmt = (p: string | null) => p ? (cur === "USD" ? `$${p}` : `L. ${p}`) : null;
                    return (
                    <div key={offer.id} className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-jungle-950">{offer.title}</p>
                        {offer.badge && (
                          <span className="flex-shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white">
                            {offer.badge}
                          </span>
                        )}
                      </div>
                      {offer.description && (
                        <p className="mt-1 text-xs text-jungle-700 line-clamp-2">{offer.description}</p>
                      )}
                      {(offer.original_price || offer.sale_price) && (
                        <div className="mt-2 flex items-center gap-2">
                          {offer.original_price && (
                            <span className="text-xs text-jungle-400 line-through">{fmt(offer.original_price)}</span>
                          )}
                          {offer.sale_price && (
                            <span className="text-sm font-bold text-green-700">{fmt(offer.sale_price)}</span>
                          )}
                        </div>
                      )}
                      {offer.expires_at && (
                        <p className="mt-1.5 text-[11px] text-jungle-400">
                          Válido hasta: {new Date(offer.expires_at + "T00:00:00").toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                  businessId={data.id}
                />

                {bookingUrl && (
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-jungle-700 px-4 py-3 text-sm font-bold text-white hover:bg-jungle-800 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Agendar cita
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 opacity-80" />
                  </a>
                )}
              </div>
            </div>

            {/* Compartir */}
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 text-sm font-bold text-jungle-950">Compartir</h3>
              <ShareButtons slug={data.slug} name={data.name} />
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
            {/* QR — featured plan only */}
            {(data as { subscription_tier?: string }).subscription_tier === "featured" && (
              <BusinessQR slug={data.slug} name={data.name} />
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

      {/* CTA para el dueño */}
      <section className="border-t border-jungle-100 bg-jungle-50 py-10">
        <div className="section-container flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-bold text-jungle-950">¿Eres el dueño de {data.name}?</p>
            <p className="mt-0.5 text-xs text-jungle-600">
              Activa tu portal y gestiona fotos, catálogo, horarios y más — sin depender de nadie.
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Link
              href="/owner/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-jungle-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-jungle-800"
            >
              Acceder al portal
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 transition-colors hover:bg-jungle-50"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>
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
