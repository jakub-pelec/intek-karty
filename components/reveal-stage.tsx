"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Rarity } from "@/db/schema";
import { CardInspect } from "@/components/card-inspect";
import { MutationBadges, RarityBadge } from "@/components/ui/badge";
import { formatCardNumber } from "@/lib/utils";

type RevealPayload = {
  id: string;
  cardName: string;
  cardNumber: number;
  rarity: Rarity;
  imageUrl: string | null;
  isDuplicate: boolean;
  holographic: boolean;
  signature: boolean;
  viewerName: string;
};

const rarityGlow: Record<Rarity, string> = {
  common: "shadow-[0_0_40px_#9aa3b5]",
  rare: "shadow-[0_0_50px_#4ea3ff]",
  epic: "shadow-[0_0_60px_#b56bff]",
  legendary: "shadow-[0_0_70px_#f5c542]",
  joker: "shadow-[0_0_80px_#ff4d8d]",
};

function fromApi(row: {
  id: string;
  viewerName: string;
  cardName: string;
  cardNumber: number;
  cardRarity: Rarity;
  cardImageUrl: string | null;
  isDuplicate: boolean;
  holographic: boolean;
  signature: boolean;
}): RevealPayload {
  return {
    id: row.id,
    viewerName: row.viewerName,
    cardName: row.cardName,
    cardNumber: row.cardNumber,
    rarity: row.cardRarity,
    imageUrl: row.cardImageUrl,
    isDuplicate: row.isDuplicate,
    holographic: row.holographic,
    signature: row.signature,
  };
}

export function RevealStage({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}) {
  const [current, setCurrent] = useState<RevealPayload | null>(null);
  const [phase, setPhase] = useState<"idle" | "mystery" | "reveal">("idle");
  const lastId = useRef<string | null>(null);

  function play(payload: RevealPayload) {
    if (lastId.current === payload.id) return;
    lastId.current = payload.id;
    setCurrent(payload);
    setPhase("mystery");
    window.setTimeout(() => setPhase("reveal"), 900);
  }

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/reveal/latest", { cache: "no-store" });
        const row = await res.json();
        if (!cancelled && row?.id) play(fromApi(row));
      } catch {
        /* overlay should stay quiet */
      }
    }

    void poll();
    const interval = window.setInterval(poll, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) return;
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const channel = client
      .channel("draws-reveal")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "draws" },
        (payload) => {
          const draw = payload.new as {
            id: string;
            is_duplicate: boolean;
            viewer_name: string;
            card_name: string;
            card_number: number;
            card_rarity: Rarity;
            card_image_url: string | null;
            holographic: boolean;
            signature: boolean;
          };
          play({
            id: draw.id,
            cardName: draw.card_name,
            cardNumber: draw.card_number,
            rarity: draw.card_rarity,
            imageUrl: draw.card_image_url,
            isDuplicate: draw.is_duplicate,
            holographic: draw.holographic,
            signature: draw.signature,
            viewerName: draw.viewer_name,
          });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [supabaseUrl, supabaseAnonKey]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      {!current || phase === "idle" ? (
        <p className="text-white/40">Waiting for a draw…</p>
      ) : (
        <div className="text-center">
          <p className="mb-3 text-lg text-white/80">{current.viewerName}</p>
          <div
            className={`mx-auto flex w-56 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-black/40 transition-all duration-700 ${
              phase === "reveal" ? rarityGlow[current.rarity] : ""
            }`}
          >
            {phase === "mystery" ? (
              <span className="text-7xl text-white/70">?</span>
            ) : (
              <CardInspect
                name={current.cardName}
                imageUrl={current.imageUrl}
                rarity={current.rarity}
                holographic={current.holographic}
                signature={current.signature}
              />
            )}
          </div>
          {phase === "reveal" ? (
            <div className="mt-4 space-y-2 text-white">
              <p className="text-sm text-white/70">
                {formatCardNumber(current.cardNumber)}
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-3xl">
                {current.cardName}
              </h2>
              <div className="flex justify-center gap-1">
                <RarityBadge rarity={current.rarity} />
                <MutationBadges
                  holographic={current.holographic}
                  signature={current.signature}
                />
              </div>
              {current.isDuplicate ? (
                <p className="text-sm text-amber-200">Duplicate — points awarded</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
