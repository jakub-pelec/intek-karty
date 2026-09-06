"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function RitualNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const links = showAdmin
    ? [...viewerLinks, { href: "/admin/queue", label: "Inner Sanctum" }]
    : viewerLinks;
  const inSanctum = pathname.startsWith("/admin");

  return (
    <div className="flex flex-col items-center gap-5">
      <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:gap-x-16">
        {links.map((link) => {
          const active = linkActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "ritual-ember font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] uppercase",
                active ? "text-[#d4b36a]" : "text-[#d7d3c8]",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      {showAdmin && inSanctum ? (
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-[#d4b36a]/25 pt-5 md:gap-x-8">
          {sanctumLinks.map((link) => {
            const active = sanctumActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "ritual-ember font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.18em] uppercase",
                  active ? "text-[#d4b36a]" : "text-[#cfc6b4]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
