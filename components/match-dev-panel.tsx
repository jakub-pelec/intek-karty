"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  startPracticeMatchAction,
  startRankedMatchAction,
  startRankedVsUserAction,
} from "@/actions/match";
import { Button } from "@/components/ui/button";

type QueuePlayer = {
  id: string;
  name: string;
  rating: number;
};

export function MatchDevPanel({
  opponents,
  rating,
}: {
  opponents: QueuePlayer[];
  rating: number;
}) {
  const t = useTranslations("match");
  const tDev = useTranslations("dev");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [opponentId, setOpponentId] = useState(opponents[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  function go(
    action: () => Promise<{ error?: string; matchId?: string }>,
  ) {
    start(async () => {
      const result = await action();
      if ("error" in result) setMessage(result.error ?? null);
      else if (result.matchId) router.push(`/match/${result.matchId}`);
    });
  }

  return (
    <div className="space-y-5 text-center">
      <p className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.2em] text-[#d4b36a] uppercase">
        {t("yourRating", { rating })}
      </p>
      <p className="text-lg text-[#d7d3c8]/80">{tDev("duelHint")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          disabled={pending}
          onClick={() => go(startPracticeMatchAction)}
        >
          {t("practice")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => go(startRankedMatchAction)}
        >
          {t("findOpponent")}
        </Button>
      </div>
      {opponents.length > 0 ? (
        <div className="flex flex-wrap items-end justify-center gap-3">
          <label className="text-left">
            <span className="mb-1 block font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] text-[#d4b36a]/70 uppercase">
              {t("pickOpponent")}
            </span>
            <select
              value={opponentId}
              onChange={(event) => setOpponentId(event.target.value)}
              className="h-10 min-w-56 rounded-none border border-[#d4b36a]/30 bg-[#05040a] px-3 text-sm text-[#d7d3c8]"
            >
              {opponents.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} · {player.rating}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !opponentId}
            onClick={() => go(() => startRankedVsUserAction(opponentId))}
          >
            {t("duelSelected")}
          </Button>
        </div>
      ) : (
        <p className="text-[#d7d3c8]/55 italic">{t("noOpponent")}</p>
      )}
      {message ? (
        <p className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#ffb4c0] uppercase">
          {message}
        </p>
      ) : null}
    </div>
  );
}
