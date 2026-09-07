"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { openBoosterAction } from "@/actions/draw";
import { Button } from "@/components/ui/button";

export function OpenBoosterButton({ userBoosterId }: { userBoosterId: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const t = useTranslations("openPack");
  const tQueue = useTranslations("queue");

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await openBoosterAction(userBoosterId);
            setMessage(result.error ?? result.success ?? null);
          })
        }
      >
        {pending ? t("opening") : tQueue("open")}
      </Button>
      {message ? <p className="max-w-48 text-right text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
