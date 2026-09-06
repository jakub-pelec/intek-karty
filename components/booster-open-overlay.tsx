"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BoosterOpenPreview } from "@/components/booster-pack-preview";
import type { OpenCard } from "@/components/booster-open-scene";
import { preloadHoloAssets } from "@/components/card-mesh";
import { openWashColor, type OpenPhase } from "@/lib/open-fx";

export function BoosterOpenOverlay({
  open,
  name,
  phase,
  card,
  frontImageUrl,
  backImageUrl,
  eyebrow,
  details,
  onDismiss,
}: {
  open: boolean;
  name: string;
  phase: OpenPhase;
  card?: OpenCard | null;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  eyebrow?: string;
  details?: ReactNode;
  onDismiss: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const canDismiss = phase === "reveal" && Boolean(card);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) preloadHoloAssets();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canDismiss) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canDismiss, onDismiss]);

  if (!mounted || !open) return null;

  const wash = openWashColor(phase, card?.rarity);
  const rarityLive = phase === "burst" || phase === "reveal";

  return createPortal(
    <div
      className="open-overlay fixed inset-0 z-[80] bg-[#05040a]"
      role="dialog"
      aria-modal
      aria-label={card ? `${card.name} revealed` : `Opening ${name}`}
    >
      <div
        className="open-veil pointer-events-none absolute inset-0"
        style={rarityLive ? { animation: "none", opacity: 0.22 } : undefined}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: rarityLive ? 0.45 : 0.18,
          background: `radial-gradient(ellipse at 50% 45%, ${wash}40 0%, transparent 55%)`,
        }}
      />
      {phase === "burst" ? (
        <div
          className="open-flash pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 46%, ${wash}99, transparent 42%)`,
          }}
        />
      ) : null}

      <div className="absolute inset-0">
        <BoosterOpenPreview
          name={name}
          frontImageUrl={frontImageUrl}
          backImageUrl={backImageUrl}
          phase={phase}
          card={card}
          fullscreen
        />
      </div>

      {canDismiss ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-4 px-6 pb-10 pt-24">
          {eyebrow ? (
            <p className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.28em] text-[#d4b36a] uppercase">
              {eyebrow}
            </p>
          ) : null}
          {details}
          <button
            type="button"
            onClick={onDismiss}
            className="pointer-events-auto mt-2 font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.28em] text-[#d7d3c8] uppercase transition-colors hover:text-[#d4b36a]"
          >
            Continue
          </button>
        </div>
      ) : (
        <p className="pointer-events-none absolute inset-x-0 bottom-10 z-20 text-center font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.28em] text-[#d7d3c8]/70 uppercase">
          {phase === "charge" ? "The seal is breaking" : "The vision arrives"}
        </p>
      )}
    </div>,
    document.body,
  );
}
