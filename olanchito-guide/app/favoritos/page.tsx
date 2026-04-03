"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BusinessCard from "@/components/BusinessCard";
import Link from "next/link";
import { HeartIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "Olanchito-guide";
const FALLBACK =
  process.env.NEXT_PUBLIC_FALLBACK_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

type Business = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  description: string | null;
  image: string | null;
  category_id: string | null;
  featured: boolean;
  categoryName: string;
};

export default function FavoritesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading]       = useState(true);
  const [slugs, setSlugs]           = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("olanchito_favorites") ?? "[]");
      setSlugs(saved);
    } catch {
      setSlugs([]);
    }
  }, []);

  useEffect(() => {
    if (slugs.length === 0) { setLoading(false); return; }

    async function fetchFavorites() {
      const [{ data: biz }, { data: cats }] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, slug, address, description, image, category_id, featured")
          .in("slug", slugs),
        supabase.from("categories").select("id, name"),
      ]);

      const catMap = Object.fromEntries((cats ?? []).map((c) => [c.id, c.name]));

      const mapped = (biz ?? []).map((b) => {
        let imageUrl = FALLBACK;
        if (b.image) {
          const clean = b.image.startsWith("business/") ? b.image : `business/${b.image}`;
          imageUrl = supabase.storage.from(BUCKET).getPublicUrl(clean).data.publicUrl ?? FALLBACK;
        }
        return {
          ...b,
          image: imageUrl,
          categoryName: catMap[b.category_id ?? ""] ?? "",
        };
      });

      // Keep the order from localStorage
      mapped.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
      setBusinesses(mapped);
      setLoading(false);
    }

    fetchFavorites();
  }, [slugs]);

  return (
    <main className="page-shell">
      <section className="section-container pt-10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 ring-1 ring-red-200">
            <HeartIcon className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
            >
              Mis favoritos
            </h1>
            {!loading && (
              <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                {businesses.length} negocio{businesses.length !== 1 ? "s" : ""} guardado{businesses.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section-container pb-16">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
            <HeartIcon className="mx-auto mb-3 h-10 w-10 text-jungle-200" />
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Aún no tienes favoritos
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--ink-3)" }}>
              Toca el corazón en cualquier negocio para guardarlo aquí.
            </p>
            <Link href="/businesses" className="btn-primary mt-6 inline-flex !text-xs !py-2">
              <BuildingStorefrontIcon className="h-3.5 w-3.5" />
              Explorar negocios
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard
                key={b.id}
                business={{
                  name: b.name,
                  slug: b.slug,
                  image: b.image ?? FALLBACK,
                  address: b.address ?? "",
                  description: b.description ?? "",
                  category: b.categoryName,
                  featured: b.featured ?? false,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
