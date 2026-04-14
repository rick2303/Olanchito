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
          "/negocios?*",    // filtros y paginación — el contenido canónico vive en /categorias/[slug]
          "/businesses?*",  // ruta legacy (redirect a /negocios), también bloqueada por si acaso
        ],
      },
    ],
    sitemap: "https://olanchito.com/sitemap.xml",
    host: "https://olanchito.com",
  };
}
