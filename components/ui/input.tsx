import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-none border border-[#d4b36a]/30 bg-[#05040a] px-3 text-sm text-[#d7d3c8] placeholder:text-[#d7d3c8]/35 focus:border-[#d4b36a] focus:outline-none";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={cn("h-10", fieldClass, className)} {...props} />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn("min-h-24 py-2", fieldClass, className)} {...props} />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1 block font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.2em] text-[#d4b36a]/70 uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("h-10", fieldClass, className)} {...props} />
  );
}

export function Check({
  className,
  children,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: string }) {
  return (
    <label className="flex items-center gap-2 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] text-[#d7d3c8] uppercase">
      <input type="checkbox" className={cn("accent-[#d4b36a]", className)} {...props} />
      {children}
    </label>
  );
}
