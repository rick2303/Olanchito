// app/business/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { slug: string };
};

const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";
const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

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
  cookies();

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
      category_id
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
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-jungle-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-jungle-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Volver a negocios
            </Link>
          </div>
        </section>
      </main>
    );
  }

  let imageUrl = FALLBACK_IMAGE;
  if (data.image && typeof data.image === "string") {
    const cleanPath = data.image.startsWith("business/")
      ? data.image
      : `business/${data.image}`;
    const { data: imgData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(cleanPath);
    imageUrl = imgData?.publicUrl ?? FALLBACK_IMAGE;
  }

  // Categoría
  let category: { name: string; slug: string } | null = null;
  if (data.category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", data.category_id)
      .single();
    category = cat ?? null;
  }

  const socials = (data.socials as Record<string, string> | null) ?? null;
  const location =
    (data.location as { lat?: number; lng?: number } | null) ?? null;

  const phone = normalizePhone(data.phone ?? "");
  const waLink = buildWhatsAppLink(data.whatsapp ?? "");
  const web = normalizeUrl(socials?.website);
  const ig = normalizeUrl(socials?.instagram);
  const fb = normalizeUrl(socials?.facebook);

  const hasMap = Boolean(location?.lat && location?.lng);
  const services = Array.isArray(data.services)
    ? (data.services as string[]).filter(Boolean)
    : [];

  // ✅ Chips con contraste fijo en desktop
  const pillBase =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold";

  const pillMobile =
    "bg-jungle-50 text-jungle-900 ring-1 ring-jungle-200 hover:bg-jungle-100";

  const pillDesktop =
    "lg:bg-black/50 lg:text-white lg:ring-1 lg:ring-white/25 lg:shadow-[0_10px_30px_rgba(0,0,0,0.28)] lg:backdrop-blur";

  return (
    <main className="min-h-screen bg-jungle-50">
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
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-jungle-900 ring-1 ring-black/10 hover:bg-jungle-50"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver
              </Link>

              <div className="flex items-center gap-2">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-jungle-900 ring-1 ring-black/10 hover:bg-jungle-50"
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-3 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-green-700"
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

                <span className={[pillBase, pillMobile, pillDesktop].join(" ")}>
                  <CheckBadgeIcon className="h-4 w-4" />
                  Verificado
                </span>

                {data.hours ? (
                  <span className={[pillBase, pillMobile, pillDesktop].join(" ")}>
                    <ClockIcon className="h-4 w-4" />
                    {data.hours}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-jungle-950 sm:text-3xl lg:text-4xl lg:text-white">
                {data.name}
              </h1>

              {/* Dirección en hero (como lo tenés) */}
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-black/45 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/55"
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-green-700"
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
            {/* Descripción */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-jungle-700" />
                </div>
                <h2 className="text-lg font-black text-jungle-950">Descripción</h2>
              </div>

              {data.description ? (
                <p className="mt-4 text-sm leading-relaxed text-jungle-800 sm:text-base">
                  {data.description}
                </p>
              ) : (
                <p className="mt-4 text-sm text-jungle-700/70 italic">
                  Sin descripción disponible.
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
                  <h2 className="text-lg font-black text-jungle-950">Servicios</h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {services.map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="inline-flex items-center rounded-full bg-jungle-50 px-3 py-1 text-xs font-extrabold text-jungle-900 ring-1 ring-jungle-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Ubicación (✅ dirección arriba del mapa, igual en mobile) */}
            {hasMap ? (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                    <MapPinIcon className="h-5 w-5 text-jungle-700" />
                  </div>
                  <h2 className="text-lg font-black text-jungle-950">Ubicación</h2>
                </div>

                {/* ✅ Dirección ANTES del mapa */}
                {data.address ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-jungle-50 px-4 py-3 ring-1 ring-jungle-200">
                    <MapPinIcon className="h-5 w-5 text-jungle-700 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-jungle-900">Dirección</p>
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50 sm:w-auto"
                  >
                    Abrir en Maps
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6">
            {/* Contacto (✅ sin dirección) */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
              <h3 className="text-base font-black text-jungle-950">Contacto</h3>

              <div className="mt-4 space-y-3">
                {data.hours ? (
                  <div className="flex items-start gap-3 rounded-2xl bg-jungle-50 px-4 py-3 ring-1 ring-jungle-200">
                    <ClockIcon className="h-5 w-5 text-jungle-700 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-jungle-900">Horario</p>
                      <p className="text-sm font-semibold text-jungle-800">{data.hours}</p>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50"
                    >
                      <PhoneIcon className="h-5 w-5 text-jungle-700" />
                      Llamar
                    </a>
                  ) : null}

                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-green-700"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Enlaces */}
            {(ig || fb || web) && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <h3 className="text-base font-black text-jungle-950">Enlaces</h3>

                <div className="mt-4 grid gap-2">
                  {ig ? (
                    <a
                      href={ig}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                          <span className="text-jungle-700">@</span>
                        </span>
                        Instagram
                      </span>
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 text-jungle-700" />
                    </a>
                  ) : null}

                  {fb ? (
                    <a
                      href={fb}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                          <span className="text-jungle-700">f</span>
                        </span>
                        Facebook
                      </span>
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 text-jungle-700" />
                    </a>
                  ) : null}

                  {web ? (
                    <a
                      href={web}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-jungle-950 ring-1 ring-black/10 hover:bg-jungle-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                          <GlobeAltIcon className="h-5 w-5 text-jungle-700" />
                        </span>
                        Sitio web
                      </span>
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 text-jungle-700" />
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
