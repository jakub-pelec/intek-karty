export function cmsPublicOrigin() {
  const raw = process.env.STRAPI_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}
