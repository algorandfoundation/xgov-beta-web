import { cn, truncateCommitteeId } from "@/functions";

/**
 * The pieces every committee row is built from — shared by the committees index
 * and the profile's voting-power list, so a committee reads the same way
 * wherever it is listed.
 */

export function CommitteeStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex shrink-0 items-center rounded-full bg-algo-green px-2 py-0.5 text-xs font-semibold text-white">
      Active
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full border border-black/[0.08] bg-algo-black-50/10 px-2 py-0.5 text-xs font-semibold text-algo-black-70 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
      Ended
    </span>
  );
}

// The rail down the side of a stacked row, marking the active committee.
export function CommitteeAccentBar({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-sm",
        active ? "bg-algo-green" : "bg-algo-black-30 dark:bg-white/20",
        className,
      )}
    />
  );
}

// The committee id, kept as a discreet identifier. Rows link to the committee
// page as a whole, so this is deliberately not a link of its own.
export function CommitteeIdLabel({
  committeeId,
  className,
}: {
  committeeId: string;
  className?: string;
}) {
  return (
    <span
      title={committeeId}
      className={cn(
        "truncate font-mono text-algo-black-50 dark:text-gray-500",
        className,
      )}
    >
      {truncateCommitteeId(committeeId)}
    </span>
  );
}

// One labelled figure in the metric grid a row collapses to on narrow screens.
export function CommitteeMetric({
  label,
  children,
  emphasized,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  emphasized?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] uppercase tracking-[0.06em] text-algo-black-50 dark:text-gray-500">
        {label}
      </div>
      <div
        className={cn(
          "tabular-nums",
          accent
            ? "text-xl font-bold text-algo-blue dark:text-algo-teal"
            : emphasized
              ? "text-xl font-bold text-algo-black dark:text-white"
              : "text-[15px] text-algo-black-70 dark:text-gray-400",
        )}
      >
        {children}
      </div>
    </div>
  );
}
