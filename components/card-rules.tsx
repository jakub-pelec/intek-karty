"use client";

import { useTranslations } from "next-intl";
import { COPY_BONUS, isCardTag, isEffectKind, type CardTag, type EffectKind, type ScoreNote } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function allyNames(allies: { name: string }[]) {
  return allies.map((ally) => ally.name).join(", ");
}

export function ScoreNoteList({
  notes,
  className,
}: {
  notes: ScoreNote[];
  className?: string;
}) {
  const t = useTranslations("scoreNote");
  const tTag = useTranslations("cardTag");

  return (
    <ul className={cn("space-y-1", className)}>
      {notes.map((note, index) => {
        let text = "";
        if (note.kind === "base") text = t("base", { amount: note.amount });
        else if (note.kind === "copy_holo") text = t("copyHolo", { amount: note.amount });
        else if (note.kind === "copy_signed") text = t("copySigned", { amount: note.amount });
        else if (note.kind === "per_tag") {
          text = t("perTag", {
            amount: note.amount,
            names: allyNames(note.allies),
            tag: tTag(note.tag),
          });
        } else if (note.kind === "per_tag_waiting") {
          text = t("perTagWaiting", { tag: tTag(note.tag) });
        } else if (note.kind === "tribe") {
          text = t("tribe", {
            amount: note.amount,
            count: note.count,
            threshold: note.threshold,
            tag: tTag(note.tag),
            names: allyNames(note.allies),
          });
        } else if (note.kind === "tribe_waiting") {
          text = t("tribeWaiting", {
            count: note.count,
            threshold: note.threshold,
            tag: tTag(note.tag),
          });
        } else if (note.kind === "lone") {
          text = t("lone", { amount: note.amount, tag: tTag(note.tag) });
        } else if (note.kind === "lone_blocked") {
          text = t("loneBlocked", {
            tag: tTag(note.tag),
            names: allyNames(note.allies),
          });
        } else {
          text = t("highRarity", {
            amount: note.amount,
            names: allyNames(note.allies),
          });
        }
        const pays =
          "amount" in note &&
          (note.kind === "per_tag" ||
            note.kind === "tribe" ||
            note.kind === "lone" ||
            note.kind === "high_rarity" ||
            note.kind === "copy_holo" ||
            note.kind === "copy_signed");
        return (
          <li
            key={`${note.kind}-${index}`}
            className={cn(
              "font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.12em] uppercase",
              pays ? "text-[#d4b36a]" : "text-[#d7d3c8]/55",
            )}
          >
            {text}
          </li>
        );
      })}
    </ul>
  );
}

export function CardRulesText({
  tags,
  effectKind,
  effectTag,
  effectValue,
  effectThreshold,
  holographic,
  signed,
  basePoints,
  className,
}: {
  tags: CardTag[];
  effectKind: string | null;
  effectTag: string | null;
  effectValue: number | null;
  effectThreshold: number | null;
  holographic?: boolean;
  signed?: boolean;
  basePoints: number;
  className?: string;
}) {
  const t = useTranslations("deck");
  const tTag = useTranslations("cardTag");
  const tEffect = useTranslations("cardEffect");
  const kind: EffectKind | null =
    effectKind && isEffectKind(effectKind) ? effectKind : null;
  const tag = effectTag && isCardTag(effectTag) ? effectTag : null;
  const copies = [
    holographic && t("copyHolo", { value: COPY_BONUS.holographic }),
    signed && t("copySigned", { value: COPY_BONUS.signed }),
  ].filter(Boolean);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#d4b36a] uppercase">
        {t("points", { count: basePoints })}
      </p>
      <p className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.12em] text-[#cfc6b4] uppercase">
        {tags.length ? tags.map((item) => tTag(item)).join(" · ") : t("noTags")}
      </p>
      <p className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.12em] text-[#d4b36a] uppercase">
        {kind
          ? tEffect(kind, {
              value: effectValue ?? 0,
              tag: tag ? tTag(tag) : t("noTags"),
              threshold: effectThreshold ?? 3,
            })
          : tEffect("none")}
      </p>
      {copies.length ? (
        <p className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.12em] text-[#d7d3c8]/70 uppercase">
          {copies.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
