import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ArrowRightIcon, MegaphoneIcon } from "@heroicons/react/24/outline";

const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";
const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

function getImageUrl(path: string | null | undefined): string {
  if (!path) return FALLBACK_IMAGE;
  const cleanPath = path.startsWith("business/") ? path : `business/${path}`;
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath).data.publicUrl ?? FALLBACK_IMAGE;
}

export default async function AnnouncementsSection() {
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("businesses")
    .select("id, name, slug, image, announcement, announcement_expires_at")
    .eq("subscription_tier", "featured")
    .eq("subscription_active", true)
    .not("announcement", "is", null)
    .or(`announcement_expires_at.is.null,announcement_expires_at.gt.${now}`)
    .order("name", { ascending: true })
    .limit(6);

  const announcements = data ?? [];

  if (announcements.length === 0) return null;

  return (
    <section className="section-container pb-14 sm:pb-16">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-2">Anuncios de negocios</p>
          <h2 className="heading-xl">Promociones y novedades</h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {announcements.map((biz) => (
          <Link
            key={biz.id}
            href={`/negocios/${biz.slug}`}
            className="panel group flex gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* Business image */}
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl bg-jungle-50 ring-1 ring-black/5">
              <Image
                src={getImageUrl(biz.image)}
                alt={biz.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5">
                <MegaphoneIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                <p
                  className="truncate text-xs font-bold"
                  style={{ color: "var(--ink-2)" }}
                >
                  {biz.name}
                </p>
              </div>
              <p
                className="line-clamp-3 text-sm leading-snug"
                style={{ color: "var(--ink)" }}
              >
                {biz.announcement}
              </p>
              <div
                className="mt-2.5 flex items-center gap-1 text-xs font-semibold transition-transform group-hover:translate-x-0.5"
                style={{ color: "var(--primary-mid)" }}
              >
                Ver negocio
                <ArrowRightIcon className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
