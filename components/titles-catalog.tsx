"use client";

import { useState } from "react";
import { TitleProgress } from "@/components/title-progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TitleRow = {
  id: string;
  name: string;
  description: string;
  meta: string;
  done: boolean;
  current: number;
  required: number;
};

export function TitlesCatalog({ rows }: { rows: TitleRow[] }) {
  const [hideBestowed, setHideBestowed] = useState(false);
  const visible = hideBestowed ? rows.filter((row) => !row.done) : rows;

  return (
    <>
      <div className="mb-8 flex justify-center">
        <Button
          type="button"
          size="md"
          aria-pressed={hideBestowed}
          onClick={() => setHideBestowed((value) => !value)}
        >
          {hideBestowed ? "Show bestowed" : "Hide bestowed"}
        </Button>
      </div>
      <ul className="overflow-hidden border border-[#d4b36a]/30 bg-[#0c0b12]">
        {visible.length === 0 ? (
          <li className="px-6 py-8 text-center text-lg text-[#d7d3c8]">
            Every remaining title is bestowed.
          </li>
        ) : (
          visible.map((row) => (
            <li
              key={row.id}
              className={cn(
                "border-b border-[#d7d3c8]/15 px-6 py-5 last:border-b-0",
                row.done && "bg-[#7dbe72]/10",
              )}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  className={cn(
                    "font-[family-name:var(--font-cormorant)] text-[26px] italic",
                    row.done ? "text-[#f3efe6]" : "text-[#d7d3c8]",
                  )}
                >
                  {row.name}
                </h2>
                <span
                  className={cn(
                    "shrink-0 font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] uppercase",
                    row.done ? "text-[#7dbe72]" : "text-[#d7d3c8]",
                  )}
                >
                  {row.done ? "Bestowed" : "Sealed"}
                </span>
              </div>
              <p className="mt-2 text-lg leading-relaxed text-[#d7d3c8]">
                {row.description}
              </p>
              <p className="mt-3 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.12em] text-[#cfc6b4] uppercase">
                {row.meta}
              </p>
              <TitleProgress
                current={row.current}
                required={row.required}
                complete={row.done}
              />
            </li>
          ))
        )}
      </ul>
    </>
  );
}
