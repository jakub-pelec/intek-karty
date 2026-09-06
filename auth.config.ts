import type { NextAuthConfig } from "next-auth";
import Twitch from "next-auth/providers/twitch";

const authUrl = (process.env.AUTH_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const twitchRedirectUri = `${authUrl}/api/auth/callback/twitch`;

export const authConfig = {
  trustHost: true,
  providers: [
    Twitch({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: {
        params: { redirect_uri: twitchRedirectUri },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: Number(process.env.AUTH_SESSION_MAX_AGE ?? 60 * 60 * 24 * 30),
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.twitchId = token.twitchId as string;
        session.user.role = (token.role as "viewer" | "admin") ?? "viewer";
        session.user.pointsBalance = Number(token.pointsBalance ?? 0);
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image =
          (token.picture as string | undefined) ?? session.user.image;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
