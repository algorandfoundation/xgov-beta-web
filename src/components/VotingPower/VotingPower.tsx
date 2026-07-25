import { cn } from "@/functions";
import type { CommitteeVotingPower } from "@/api/committee";
import {
  useCommitteePeriods,
  ACTIVE_PERIOD_BLOCKS,
  type CommitteePeriod,
} from "@/hooks";
import { InfoIcon } from "lucide-react";
import { format } from "date-fns";

const SPEC_URL = "https://docs.xgov.algorand.co/specs/xgov-committee";

export interface VotingPowerProps {
  committees: CommitteeVotingPower[];
  // Safe-filename form of the committee currently registered on the xGov
  // Registry. That committee (matched by id) is the only "Active" one.
  activeCommitteeId?: string;
  // Whether the signed-in user is viewing their own profile — drives the
  // "Your votes" / "Your share" vs "Votes" / "Share" labels.
  isOwnAccount?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

// Governance-period bounds are multiples of 1,000,000 rounds, e.g. 52M.
function abbreviateRound(round: number): string {
  const millions = round / 1_000_000;
  return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
}

function formatRoundsRange(start?: number, end?: number): string | null {
  if (start === undefined || end === undefined) return null;
  return `${abbreviateRound(start)} – ${abbreviateRound(end)}`;
}

// "Jan 19 – Apr 20, 2025" within a year; "Oct 17, 2025 – Jan 15, 2026" across one.
function formatDateRange(start: Date | null, end: Date | null): string | null {
  if (!start && !end) return null;
  if (start && end) {
    return start.getFullYear() === end.getFullYear()
      ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
      : `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  }
  return format((start ?? end) as Date, "MMM d, yyyy");
}

function truncateCommitteeId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function sharePercent(userVotes: number, totalVotes: number): string {
  return totalVotes > 0 ? ((userVotes / totalVotes) * 100).toFixed(1) : "0.0";
}

// Active period is [periodEnd, periodEnd + 1M) — the primary date/round range.
function activeRoundsRange(committee: CommitteeVotingPower): string | null {
  if (committee.periodEnd === undefined) return null;
  return formatRoundsRange(
    committee.periodEnd,
    committee.periodEnd + ACTIVE_PERIOD_BLOCKS,
  );
}

// Production period is [periodStart, periodEnd) — the "blocks counted" range.
function prodRoundsRange(committee: CommitteeVotingPower): string | null {
  return formatRoundsRange(committee.periodStart, committee.periodEnd);
}

// The display strings shared by the desktop and mobile rows.
function rowValues(committee: CommitteeVotingPower, period?: CommitteePeriod) {
  return {
    headline: formatDateRange(
      period?.activeStart ?? null,
      period?.activeEnd ?? null,
    ),
    activeRounds: activeRoundsRange(committee),
    prodRounds: prodRoundsRange(committee),
    prodDates: formatDateRange(
      period?.prodStart ?? null,
      period?.prodEnd ?? null,
    ),
  };
}

function StatusBadge({ active }: { active: boolean }) {
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

function AccentBar({
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

// The committee id, kept as a discreet link to the raw committee JSON.
function CommitteeIdLink({ committeeId }: { committeeId: string }) {
  return (
    <a
      href={`/api/committees/${committeeId}.json`}
      target="_blank"
      rel="noopener noreferrer"
      title={`View raw committee data (${committeeId})`}
      className="truncate font-mono text-algo-black-50 hover:text-algo-black-70 hover:underline dark:text-gray-500 dark:hover:text-gray-300"
    >
      {truncateCommitteeId(committeeId)}
    </a>
  );
}

interface RowProps {
  committee: CommitteeVotingPower;
  period?: CommitteePeriod;
  active: boolean;
}

function DesktopRow({ committee, period, active }: RowProps) {
  const { headline, activeRounds, prodRounds, prodDates } = rowValues(
    committee,
    period,
  );

  return (
    <div className="grid grid-cols-[2.1fr_0.9fr_0.9fr_1fr_0.8fr] items-center gap-5 border-b border-black/[0.08] py-[18px] dark:border-white/10">
      <div className="flex min-w-0 items-center gap-4">
        <AccentBar active={active} className="h-10 w-1" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-[-0.01em] text-algo-black dark:text-white">
              {headline ?? activeRounds ?? "Unknown period"}
            </span>
            <StatusBadge active={active} />
          </div>
          {activeRounds && (
            <div className="text-[12.5px] tabular-nums text-algo-black-70 dark:text-gray-400">
              Voting rounds {activeRounds}
            </div>
          )}
          {prodRounds && (
            <div className="text-[12.5px] tabular-nums text-algo-black-70 dark:text-gray-400">
              Committee rounds {prodRounds}
            </div>
          )}
          <div className="flex min-w-0 items-center gap-2 text-[12.5px] tabular-nums text-algo-black-70 dark:text-gray-400">
            <div className="flex min-w-0 items-center gap-1.5">
              <span>ID</span>
              <CommitteeIdLink committeeId={committee.committeeId} />
            </div>
            {prodDates && (
              <span className="ml-auto whitespace-nowrap pl-2">
                {prodDates}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="text-right text-xl font-bold tabular-nums text-algo-black dark:text-white">
        {committee.userVotes.toLocaleString()}
      </span>
      <span className="text-right text-xl font-bold tabular-nums text-algo-blue dark:text-algo-teal">
        {sharePercent(committee.userVotes, committee.totalVotes)}%
      </span>
      <span className="text-right text-[15px] tabular-nums text-algo-black-70 dark:text-gray-400">
        {committee.totalVotes.toLocaleString()}
      </span>
      <span className="text-right text-[15px] tabular-nums text-algo-black-70 dark:text-gray-400">
        {committee.memberCount.toLocaleString()}
      </span>
    </div>
  );
}

function MobileMetric({
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

function MobileRow({
  committee,
  period,
  active,
  labels,
}: RowProps & { labels: { votes: string; share: string } }) {
  const { headline, activeRounds, prodRounds, prodDates } = rowValues(
    committee,
    period,
  );

  return (
    <div className="flex gap-3.5 border-t border-black/[0.08] py-4 dark:border-white/10">
      <AccentBar active={active} className="w-1 self-stretch" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-algo-black dark:text-white">
              {headline ?? activeRounds ?? "Unknown period"}
            </span>
            <StatusBadge active={active} />
          </div>
          {/* 2×2 grid for the whole mobile range (< md) — voting rounds ·
              committee id / committee rounds · committee dates; columns aligned
              with the metric grid below (both grid-cols-2 gap-x-4) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs tabular-nums text-algo-black-70 dark:text-gray-400">
            <span>{activeRounds && `Voting rounds ${activeRounds}`}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span>ID</span>
              <CommitteeIdLink committeeId={committee.committeeId} />
            </span>
            <span>{prodRounds && `Committee rounds ${prodRounds}`}</span>
            <span>{prodDates}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <MobileMetric label={labels.votes} emphasized>
            {committee.userVotes.toLocaleString()}
          </MobileMetric>
          <MobileMetric label={labels.share} accent>
            {sharePercent(committee.userVotes, committee.totalVotes)}%
          </MobileMetric>
          <MobileMetric label="Total votes">
            {committee.totalVotes.toLocaleString()}
          </MobileMetric>
          <MobileMetric label="Members">
            {committee.memberCount.toLocaleString()}
          </MobileMetric>
        </div>
      </div>
    </div>
  );
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-black/[0.08] py-[18px] dark:border-white/10"
        >
          <span className="h-10 w-1 rounded-sm bg-black/10 dark:bg-white/10" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-48 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-3 w-64 rounded bg-black/5 dark:bg-white/5" />
            <div className="h-3 w-56 rounded bg-black/5 dark:bg-white/5" />
          </div>
          <div className="hidden h-5 w-16 rounded bg-black/10 dark:bg-white/10 md:block" />
        </div>
      ))}
    </div>
  );
}

export function VotingPower({
  committees,
  activeCommitteeId,
  isOwnAccount = false,
  isLoading = false,
  isError = false,
  className = "",
}: VotingPowerProps) {
  const periods = useCommitteePeriods(committees);
  const labels = {
    votes: isOwnAccount ? "Your votes" : "Votes",
    share: isOwnAccount ? "Your share" : "Share",
  };

  const isActive = (committeeId: string) =>
    !!activeCommitteeId && committeeId === activeCommitteeId;

  return (
    <div className={cn("mt-8", className)}>
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-algo-black dark:text-white">
            Voting power{" "}
            {committees.length > 0 && (
              <span className="font-normal text-algo-black-50 dark:text-gray-500">
                ({committees.length})
              </span>
            )}
          </h2>
          <p className="mt-1.5 max-w-[620px] text-[15px] leading-relaxed text-algo-black-70 dark:text-gray-400">
            A committee is active for a 1M-round period, the dates and "voting
            rounds" shown below. Its members and their votes come from the
            blocks each address proposed during the preceding 3M-block period,
            shown as “committee rounds”.{" "}
            <a
              href={SPEC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap font-semibold text-algo-blue hover:underline dark:text-algo-teal md:hidden"
            >
              How this works ↗
            </a>
          </p>
        </div>
        <a
          href={SPEC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden shrink-0 items-center gap-2 rounded-[10px] border border-black/[0.14] px-3.5 py-2 text-sm font-semibold text-algo-black transition-colors hover:border-algo-blue-40 hover:bg-algo-blue-10/50 dark:border-white/15 dark:text-white dark:hover:bg-white/5 md:inline-flex"
        >
          <InfoIcon className="size-[15px]" strokeWidth={2} />
          How committees work
        </a>
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <p className="text-algo-red">Error loading voting power information</p>
      ) : committees.length === 0 ? (
        <p className="text-algo-black-50 dark:text-gray-400">
          No voting power found
        </p>
      ) : (
        <>
          {/* Desktop — full-width ledger rows */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[2.1fr_0.9fr_0.9fr_1fr_0.8fr] gap-5 border-b border-black/[0.14] pb-2.5 text-xs uppercase tracking-[0.06em] text-algo-black-50 dark:border-white/15 dark:text-gray-500">
              <span>Committee active period</span>
              <span className="text-right">{labels.votes}</span>
              <span className="text-right">{labels.share}</span>
              <span className="text-right">Total votes</span>
              <span className="text-right">Members</span>
            </div>
            {committees.map((committee) => (
              <DesktopRow
                key={committee.committeeId}
                committee={committee}
                period={periods.data?.[committee.committeeId]}
                active={isActive(committee.committeeId)}
              />
            ))}
          </div>

          {/* Mobile — stacked rows with a 2×2 metric grid */}
          <div className="md:hidden">
            {committees.map((committee) => (
              <MobileRow
                key={committee.committeeId}
                committee={committee}
                period={periods.data?.[committee.committeeId]}
                active={isActive(committee.committeeId)}
                labels={labels}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
