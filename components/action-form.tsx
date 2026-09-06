"use client";

import { useActionState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ActionState = { error?: string; success?: string } | null;

export function ActionForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionState>;
  className?: string;
  children: ReactNode;
}) {
  const [state, formAction] = useActionState(
    async (_prev: ActionState, formData: FormData) => action(formData),
    null,
  );

  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {state?.error ? (
        <p className="border border-[#8b1e2d]/50 bg-[#1a0a0c] px-3 py-2 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] text-[#f3efe6] uppercase">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="border border-[#d4b36a]/25 bg-[#0c0b12] px-3 py-2 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] text-[#d4b36a] uppercase">
          {state.success}
        </p>
      ) : null}
      {children}
    </form>
  );
}
