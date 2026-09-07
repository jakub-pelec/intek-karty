"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 320;

export function AdminUserSearch({ query }: { query: string }) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const t = useTranslations("users");

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    const next = value.trim();
    const current = query.trim();
    if (next === current) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (next) params.set("q", next);
      const search = params.toString();
      router.replace(search ? `/admin/users?${search}` : "/admin/users");
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, router, value]);

  return (
    <Input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={t("searchPlaceholder")}
      aria-label={t("searchLabel")}
      autoComplete="off"
    />
  );
}
