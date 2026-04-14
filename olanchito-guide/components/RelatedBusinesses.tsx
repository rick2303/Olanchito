import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ArrowRightIcon, PhotoIcon } from "@heroicons/react/24/outline";

const BUCKET = process.env.BUCKET_NAME ?? "Olanchito-guide";
const FALLBACK =
  process.env.FALLBACK_BUCKET_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

function getImageUrl(path: string | null): string {
  if (!path) return FALLBACK;
  const clean = path.startsWith("business/") ? path : `business/${path}`;
  return supabase.storage.from(BUCKET).getPublicUrl(clean).data.publicUrl ?? FALLBACK;
}

export default async function RelatedBusinesses({
  categoryId,
  currentSlug,
  categoryName,
}: {
  categoryId: string;
  currentSlug: string;
  categoryName: string;
}) {
  const { data } = await supabase
    .from("businesses")
    .select("id, name, slug, address, image")
    .eq("category_id", categoryId)
    .neq("slug", currentSlug)
    .limit(4);

  if (!data || data.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
          Más negocios en {categoryName}
        </h2>
        <Link
          href={`/negocios?category=${categoryId}`}
          className="flex items-center gap-1 text-xs font-semibold text-jungle-600 hover:text-jungle-800"
        >
          Ver todos
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.map((b) => {
          const img = getImageUrl(b.image);
          return (
            <Link
              key={b.id}
              href={`/negocios/${b.slug}`}
              className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-jungle-50">
                {img !== FALLBACK ? (
                  <Image
                    src={img}
                    alt={b.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <PhotoIcon className="h-7 w-7 text-jungle-200" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-xs font-semibold text-jungle-950 leading-snug">
                  {b.name}
                </p>
                {b.address && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-jungle-400">{b.address}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
