import type { NextConfig } from "next";

function strapiImagePattern() {
  const raw = process.env.STRAPI_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: (url.protocol === "http:" ? "http" : "https") as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return null;
  }
}

const strapiPattern = strapiImagePattern();

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "static-cdn.jtvnw.net" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.up.railway.app" },
      ...(strapiPattern ? [strapiPattern] : []),
    ],
  },
};

export default nextConfig;
