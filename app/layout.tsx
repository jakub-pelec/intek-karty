import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Fraunces, Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cmsPublicOrigin } from "@/lib/cms-origin";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  preload: false,
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("brand"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cmsOrigin = cmsPublicOrigin();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geist.variable} ${fraunces.variable} ${cinzel.variable} ${cormorant.variable} h-dvh antialiased`}
    >
      <head>
        {cmsOrigin ? (
          <>
            <link rel="preconnect" href={cmsOrigin} />
            <link rel="dns-prefetch" href={cmsOrigin} />
          </>
        ) : null}
      </head>
      <body className="min-h-dvh" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
