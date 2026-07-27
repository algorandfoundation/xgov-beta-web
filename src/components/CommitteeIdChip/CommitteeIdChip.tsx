import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/functions";

export interface CommitteeIdChipProps {
  // The committee id in its full base64 form — what gets copied.
  committeeId: string;
  className?: string;
}

/**
 * The committee id, sitting on the hero's blue ground, with click-to-copy. The
 * id is the hash of the ARC-86 file and the value declared on the Registry, so
 * it is the one string a reader needs to verify everything else on the page.
 */
export function CommitteeIdChip({
  committeeId,
  className,
}: CommitteeIdChipProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  // Clicking again restarts the two seconds rather than stacking timers, and an
  // unmount mid-countdown leaves nothing pending.
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(committeeId);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context, denied permission) — the id is
      // fully visible in the chip, so there is nothing to recover from.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={committeeId}
      aria-label={copied ? "Committee ID copied" : "Copy committee ID"}
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-[10px] border border-white/25 px-3 py-2.5 text-left transition-colors hover:border-white/50 hover:bg-white/5",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-xs md:text-[13px]">
        {committeeId}
      </span>
      <span className="grid shrink-0 place-items-center text-algo-green">
        {copied ? (
          <CheckIcon className="size-[15px]" strokeWidth={2} />
        ) : (
          <CopyIcon className="size-[15px]" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
