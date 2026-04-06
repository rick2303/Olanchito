import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/login",
          "/api/",
          "/owner/",
          "/businesses?*",   // filter URLs — canonical content lives at /categories/[slug]
          "/negocios?*",     // same for negocios if it accepts query params
        ],
      },
    ],
    sitemap: "https://olanchito.com/sitemap.xml",
    host: "https://olanchito.com",
  };
}
