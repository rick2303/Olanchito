import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  ArrowRightIcon,
  SparklesIcon,
  StarIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const BUCKET_NAME = process.env.BUCKET_NAME ?? "Olanchito-guide";
const FALLBACK_IMAGE =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function NovedadesSection() {
  const since = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const [{ data: newBusinesses }, { data: recentReviews }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug, image, category_id, address, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("reviews")
      .select("id, author_name, rating, comment, business_slug, created_at")
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const hasNew = (newBusinesses ?? []).length > 0;
  const hasReviews = (recentReviews ?? []).length > 0;

  if (!hasNew && !hasReviews) return null;

  // Fetch category names for new businesses
  const catIds = [...new Set((newBusinesses ?? []).map((b) => b.category_id).filter(Boolean))];
  const { data: cats } = catIds.length
    ? await supabase.from("categories").select("id, name").in("id", catIds)
    : { data: [] };
  const catMap = Object.fromEntries((cats ?? []).map((c) => [c.id, c.name]));

  // Fetch business names for recent reviews
  const slugs = [...new Set((recentReviews ?? []).map((r) => r.business_slug))];
  const { data: bizNames } = slugs.length
    ? await supabase.from("businesses").select("slug, name").in("slug", slugs)
    : { data: [] };
  const bizMap = Object.fromEntries((bizNames ?? []).map((b) => [b.slug, b.name]));

  return (
    <section className="section-container pb-14 sm:pb-16">
      <div className="mb-8 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4" style={{ color: "var(--accent)" }} />
        <p className="section-label">Novedades</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Negocios nuevos ── */}
        {hasNew && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="heading-xl text-lg">Negocios nuevos esta semana</h2>
              <Link
                href="/businesses?nuevo=1"
                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: "var(--primary-mid)" }}
              >
                Ver todos
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {(newBusinesses ?? []).map((b) => {
                let imageUrl = FALLBACK_IMAGE;
                if (b.image) {
                  const clean = b.image.startsWith("business/") ? b.image : `business/${b.image}`;
                  const { data: img } = supabase.storage.from(BUCKET_NAME).getPublicUrl(clean);
                  imageUrl = img?.publicUrl ?? FALLBACK_IMAGE;
                }
                return (
                  <Link
                    key={b.id}
                    href={`/negocios/${b.slug}`}
                    className="group flex items-center gap-3 rounded-2xl p-3 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      boxShadow: "var(--shadow-xs)",
                    }}
                  >
                    <div
                      className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <Image
                        src={imageUrl}
                        alt={b.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-semibold"
                        style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}
                      >
                        {b.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                        {catMap[b.category_id ?? ""] ?? "Negocio"} · {b.address ?? "Olanchito"}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "#dcfce7", color: "#15803d" }}
                    >
                      ✨ Nuevo
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Reseñas recientes ── */}
        {hasReviews && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="heading-xl text-lg">Últimas reseñas</h2>
              <Link
                href="/businesses"
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--primary-mid)" }}
              >
                Ver negocios
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {(recentReviews ?? []).map((r) => (
                <Link
                  key={r.id}
                  href={`/negocios/${r.business_slug}`}
                  className="group block rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ChatBubbleLeftIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--ink-3)" }} />
                      <p className="truncate text-xs font-semibold" style={{ color: "var(--ink-2)" }}>
                        {bizMap[r.business_slug] ?? r.business_slug}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarSolid
                          key={n}
                          className={`h-3 w-3 ${n <= r.rating ? "text-amber-400" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p
                      className="line-clamp-2 text-xs leading-relaxed"
                      style={{ color: "var(--ink-2)" }}
                    >
                      "{r.comment}"
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px]" style={{ color: "var(--ink-3)" }}>
                    — {r.author_name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
