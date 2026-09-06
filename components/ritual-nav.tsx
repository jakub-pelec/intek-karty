"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const viewerLinks = [
  { href: "/dashboard", label: "Altar" },
  { href: "/collection", label: "Collection" },
  { href: "/achievements", label: "Titles" },
  { href: "/shop", label: "Offerings" },
  { href: "/history", label: "Chronicle" },
];

const sanctumLinks = [
  { href: "/admin/queue", label: "Queue" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/rewards", label: "Fulfillment" },
  { href: "/admin/history", label: "Draws" },
  { href: "/admin/dev", label: "Dev" },
];

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
  const links = showAdmin
    ? [...viewerLinks, { href: "/admin/queue", label: "Inner Sanctum" }]
    : viewerLinks;
  const inSanctum = pathname.startsWith("/admin");

  useEffect(() => {
    const hrefs = [...viewerLinks.map((link) => link.href)];
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
    <div className="flex flex-col items-center gap-5">
      <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:gap-x-16">
        {links.map((link) => {
          const active = linkActive(pathname, link.href);
          return (
            <DeferredLink
              key={link.href}
              href={link.href}
              className={cn(
                "ritual-ember font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] uppercase",
                active ? "text-[#d4b36a]" : "text-[#d7d3c8]",
              )}
            >
              {link.label}
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
                {link.label}
              </DeferredLink>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
