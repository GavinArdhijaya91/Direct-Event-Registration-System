import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/daftar"],
        disallow: ["/admin/", "/ticket/", "/api/"],
      },
    ],
  };
}
