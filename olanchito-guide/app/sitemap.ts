import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://olanchito.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: businesses } = await supabase
    .from("businesses")
    .select("slug, updated_at");

  const businessUrls: MetadataRoute.Sitemap = (businesses ?? []).map((b) => ({
    url: `${BASE_URL}/negocios/${b.slug}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const { data: categories } = await supabase
    .from("categories")
    .select("slug");

  const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${BASE_URL}/businesses?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/businesses`,    changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/categories`,    changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/join`,          changeFrequency: "monthly", priority: 0.5 },
  ];

  return [...staticUrls, ...businessUrls, ...categoryUrls];
}
