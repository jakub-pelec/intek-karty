import type { ReactNode } from "react";

export function RitualPageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-12 text-center">
      <h1 className="font-[family-name:var(--font-cormorant)] text-[42px] tracking-wide text-[#cfc6b4] italic md:text-[55px]">
        {title}
      </h1>
      {eyebrow ? (
        <p className="mt-3 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.3em] text-[#d4b36a] uppercase">
          {eyebrow}
        </p>
      ) : null}
      {children}
    </header>
  );
}
