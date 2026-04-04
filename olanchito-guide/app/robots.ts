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
          "/*?*page=*&*view=map*",  // don't index map view URLs
        ],
      },
    ],
    sitemap: "https://olanchito.com/sitemap.xml",
    host: "https://olanchito.com",
  };
}
