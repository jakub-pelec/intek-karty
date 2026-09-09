"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Gift,
  History,
  LayoutDashboard,
  Layers,
  ListOrdered,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  Store,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { Role } from "@/db/schema";
import { cn } from "@/lib/utils";

type UserInfo = {
  name: string;
  image: string | null;
  role: Role;
  pointsBalance: number;
};

const viewerTabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/history", label: "History", icon: History },
];

const adminSubtabs = [
  { href: "/admin/queue", label: "Queue", icon: ListOrdered },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/rewards", label: "Fulfillment", icon: Gift },
  { href: "/admin/history", label: "Draws", icon: History },
  { href: "/admin/dev", label: "Dev", icon: Sparkles },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  children,
}: {
  user: UserInfo;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onAdminRoute = pathname.startsWith("/admin");
  const [adminOpen, setAdminOpen] = useState(onAdminRoute);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (onAdminRoute) setAdminOpen(true);
  }, [onAdminRoute]);

  return (
    <div className="min-h-dvh">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-display)] text-xl tracking-wide"
          >
            Intek Binder
          </Link>
          <button
            type="button"
            className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-2 text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
            Collection
          </p>
          <ul className="space-y-0.5">
            {viewerTabs.map((tab) => (
              <li key={tab.href}>
                <NavLink
                  href={tab.href}
                  label={tab.label}
                  icon={tab.icon}
                  active={isActive(pathname, tab.href)}
                />
              </li>
            ))}
          </ul>

          {user.role === "admin" ? (
            <div className="mt-6">
              <p className="mb-2 px-2 text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                Staff
              </p>
              <div
                className={cn(
                  "flex items-center rounded-lg",
                  onAdminRoute ? "bg-[var(--surface-2)]" : "",
                )}
              >
                <Link
                  href="/admin/queue"
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                    onAdminRoute
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  Admin panel
                </Link>
                <button
                  type="button"
                  onClick={() => setAdminOpen((open) => !open)}
                  className="rounded-md p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-expanded={adminOpen}
                  aria-label={adminOpen ? "Collapse admin panel" : "Expand admin panel"}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      adminOpen ? "rotate-180" : "",
                    )}
                  />
                </button>
              </div>
              {adminOpen ? (
                <ul className="mt-1 space-y-0.5 border-l border-[var(--border)] ml-4 pl-2">
                  {adminSubtabs.map((tab) => (
                    <li key={tab.href}>
                      <NavLink
                        href={tab.href}
                        label={tab.label}
                        icon={tab.icon}
                        active={isActive(pathname, tab.href)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="mb-3 flex items-center gap-2 px-1">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm">
                {user.name.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{user.name}</p>
              <p className="text-xs text-[var(--accent)]">{user.pointsBalance} pts</p>
            </div>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit" className="w-full justify-start">
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-64">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 lg:hidden">
          <button
            type="button"
            className="rounded-md p-1 text-[var(--foreground)] hover:bg-[var(--surface-2)]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-display)] text-lg tracking-wide"
          >
            Intek Binder
          </Link>
          <span className="rounded-full border border-[var(--accent)]/40 px-2 py-0.5 text-xs text-[var(--accent)]">
            {user.pointsBalance} pts
          </span>
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
        active
          ? "bg-[var(--accent)]/15 text-[var(--accent)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
