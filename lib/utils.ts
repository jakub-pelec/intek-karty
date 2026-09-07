import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCardNumber(n: number) {
  return `#${String(n).padStart(3, "0")}`;
}

export function formatDate(value: Date | string, locale = "en") {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function parseAdminTwitchIds(raw = process.env.ADMIN_TWITCH_IDS) {
  return (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
