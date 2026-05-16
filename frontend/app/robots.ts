import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/privacy", "/terms", "/robots.txt", "/sitemap.xml"],
        disallow: [
          "/",
          "/admin",
          "/channels",
          "/messages",
          "/profile",
          "/projects",
          "/settings",
          "/suggestions",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
