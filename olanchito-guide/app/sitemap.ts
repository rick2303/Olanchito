import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://olanchito.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: businesses }, { data: categories }] = await Promise.all([
    supabase.from("businesses").select("slug, created_at"),
    supabase.from("categories").select("slug, businesses(count)"),
  ]);

  const businessUrls: MetadataRoute.Sitemap = (businesses ?? []).map((b) => ({
    url: `${BASE_URL}/negocios/${b.slug}`,
    lastModified: b.created_at ? new Date(b.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Las categorías vacías están en noindex: no se mandan al sitemap
  const categoryUrls: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => ((c.businesses as { count: number }[] | null)?.[0]?.count ?? 0) > 0)
    .map((c) => ({
    url: `${BASE_URL}/categorias/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL,                       lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/negocios`,          lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/categorias`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/visitar-olanchito`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/sugerir-negocio`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/registrar`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/precios`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  return [...staticUrls, ...categoryUrls, ...businessUrls];
}
