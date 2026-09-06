import type { NextConfig } from "next";

function strapiImageHost() {
  const raw = process.env.STRAPI_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const strapiHost = strapiImageHost();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static-cdn.jtvnw.net" },
      { protocol: "https", hostname: "*.supabase.co" },
      ...(strapiHost
        ? [{ protocol: "https" as const, hostname: strapiHost }]
        : []),
    ],
  },
};

export default nextConfig;
