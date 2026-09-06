"use client";

import { useState, useTransition } from "react";
import { redeemRewardAction } from "@/actions/shop";
import { Button } from "@/components/ui/button";

export function RedeemButton({
  rewardId,
  disabled,
}: {
  rewardId: string;
  disabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled || pending}
        className="ritual-ember-text h-auto rounded-none px-0 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.24em] text-[#f3efe6] uppercase hover:bg-transparent"
        onClick={() =>
          start(async () => {
            const result = await redeemRewardAction(rewardId);
            setMessage(result.error ?? result.success ?? null);
          })
        }
      >
        {pending ? "Binding…" : "Claim"}
      </Button>
      {message ? (
        <p className="font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.16em] text-[#d7d3c8]/70 uppercase">
          {message}
        </p>
      ) : null}
    </div>
  );
}
