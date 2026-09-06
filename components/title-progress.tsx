import { cn } from "@/lib/utils";

export function TitleProgress({
  current,
  required,
  complete = false,
}: {
  current: number;
  required: number;
  complete?: boolean;
}) {
  const pct = required <= 0 ? 0 : Math.min(100, (current / required) * 100);
  const now = required <= 0 ? 0 : Math.min(current, required);

  return (
    <div className="mt-4 flex items-center gap-3">
      <div
        className={cn(
          "h-[6px] min-w-0 flex-1",
          complete ? "bg-[#7dbe72]/20" : "bg-[#d4b36a]/15",
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={Math.max(required, 0)}
        aria-valuenow={now}
        aria-label={`${current} of ${required}`}
      >
        <div
          className={cn(
            "h-full",
            complete
              ? "bg-[#7dbe72] shadow-[0_0_10px_rgba(125,190,114,0.45)]"
              : "bg-[#d4b36a] shadow-[0_0_10px_rgba(212,179,106,0.45)]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "shrink-0 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.12em] tabular-nums",
          complete ? "text-[#7dbe72]" : "text-[#d4b36a]",
        )}
      >
        {current}/{required}
      </span>
    </div>
  );
}
