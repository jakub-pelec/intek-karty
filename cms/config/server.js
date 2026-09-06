module.exports = ({ env }) => {
  const publicUrl =
    env("PUBLIC_URL") ||
    (env("RAILWAY_PUBLIC_DOMAIN")
      ? `https://${env("RAILWAY_PUBLIC_DOMAIN")}`
      : undefined);

  return {
    host: env("HOST", "0.0.0.0"),
    port: env.int("PORT", 1337),
    url: publicUrl,
    proxy: Boolean(publicUrl),
    app: {
      keys: env.array("APP_KEYS"),
    },
  };
};
