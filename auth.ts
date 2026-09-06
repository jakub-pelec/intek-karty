import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { upsertUserFromTwitch } from "@/db/queries/users";

function twitchName(profile: unknown, fallback: string) {
  if (!profile || typeof profile !== "object") return fallback;
  const p = profile as Record<string, unknown>;
  return (
    (typeof p.preferred_username === "string" && p.preferred_username) ||
    (typeof p.display_name === "string" && p.display_name) ||
    (typeof p.login === "string" && p.login) ||
    (typeof p.name === "string" && p.name) ||
    fallback
  );
}

function twitchImage(profile: unknown) {
  if (!profile || typeof profile !== "object") return null;
  const p = profile as Record<string, unknown>;
  if (typeof p.picture === "string") return p.picture;
  if (typeof p.profile_image_url === "string") return p.profile_image_url;
  if (typeof p.image === "string") return p.image;
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "twitch" || !account.providerAccountId) {
        return false;
      }
      await upsertUserFromTwitch({
        twitchId: account.providerAccountId,
        name: twitchName(profile, `twitch:${account.providerAccountId}`),
        image: twitchImage(profile),
      });
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "twitch" && account.providerAccountId) {
        const user = await upsertUserFromTwitch({
          twitchId: account.providerAccountId,
          name: twitchName(
            profile,
            token.name ?? `twitch:${account.providerAccountId}`,
          ),
          image:
            twitchImage(profile) ??
            (typeof token.picture === "string" ? token.picture : null),
        });
        token.userId = user.id;
        token.twitchId = user.twitchId;
        token.role = user.role;
        token.pointsBalance = user.pointsBalance;
        token.name = user.name;
        token.picture = user.image ?? undefined;
      }
      return token;
    },
  },
});
