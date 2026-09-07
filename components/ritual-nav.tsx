"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const viewerLinks = [
  { href: "/dashboard", key: "altar" },
  { href: "/collection", key: "collection" },
  { href: "/achievements", key: "titles" },
  { href: "/shop", key: "offerings" },
  { href: "/history", key: "chronicle" },
] as const;

const sanctumLinks = [
  { href: "/admin/queue", key: "queue" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/rewards", key: "fulfillment" },
  { href: "/admin/history", key: "draws" },
  { href: "/admin/dev", key: "dev" },
] as const;

function linkActive(pathname: string, href: string) {
  if (href === "/admin/queue") {
    return pathname.startsWith("/admin");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function sanctumActive(pathname: string, href: string) {
  if (href === "/admin/queue") {
    return pathname === "/admin/queue" || pathname.startsWith("/admin/open");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DeferredLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
    >
      {children}
    </Link>
  );
}

export function RitualNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const links = showAdmin
    ? [...viewerLinks, { href: "/admin/queue", key: "innerSanctum" as const }]
    : viewerLinks;
  const inSanctum = pathname.startsWith("/admin");

  useEffect(() => {
    const hrefs: string[] = viewerLinks.map((link) => link.href);
    if (showAdmin) hrefs.push("/admin/queue");
    if (showAdmin && pathname.startsWith("/admin")) {
      hrefs.push(...sanctumLinks.map((link) => link.href));
    }

    let cancelled = false;
    const prefetchAll = () => {
      if (cancelled) return;
      for (const href of hrefs) router.prefetch(href);
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(prefetchAll, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(prefetchAll, 1200);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [pathname, router, showAdmin]);

  return (
    <div className="flex flex-col items-center gap-4 md:gap-5">
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-16 md:gap-y-3">
        {links.map((link) => {
          const active = linkActive(pathname, link.href);
          return (
            <DeferredLink
              key={link.href}
              href={link.href}
              className={cn(
                "ritual-ember font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.14em] uppercase md:text-[11px] md:tracking-[0.2em]",
                active ? "text-[#d4b36a]" : "text-[#d7d3c8]",
              )}
            >
              {t(link.key)}
            </DeferredLink>
          );
        })}
      </nav>
      {showAdmin && inSanctum ? (
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-[#d4b36a]/25 pt-5 md:gap-x-8">
          {sanctumLinks.map((link) => {
            const active = sanctumActive(pathname, link.href);
            return (
              <DeferredLink
                key={link.href}
                href={link.href}
                className={cn(
                  "ritual-ember font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.18em] uppercase",
                  active ? "text-[#d4b36a]" : "text-[#cfc6b4]",
                )}
              >
                {t(link.key)}
              </DeferredLink>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
