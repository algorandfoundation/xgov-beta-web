import { useMemo } from "react";
import { format } from "date-fns";
import { InfoIcon } from "lucide-react";
import { useWallet } from "@txnlab/use-wallet-react";

import {
  axisSpan,
  buildCommitteeAxis,
  cn,
  formatDateRange,
  formatRoundsRange,
  type CommitteeAxis,
} from "@/functions";
import { ACTIVE_PERIOD_BLOCKS, type CommitteeSummary } from "@/api/committee";
import { COMMITTEE_SPEC_URL } from "@/api/committee-artifacts";
import { network } from "@/api/algorand/algo-client";
import { CommitteeIdChip } from "@/components/CommitteeIdChip/CommitteeIdChip";
import {
  CommitteeAccentBar,
  CommitteeIdLabel,
  CommitteeMetric,
  CommitteeStatusBadge,
} from "@/components/CommitteeRow/CommitteeRow";
import { UseQuery, UseWallet, useCommitteeVotes } from "@/hooks";

export interface CommitteesIndexProps {
  // Newest committee first, as `loadCommitteeSummaries` returns them.
  committees: CommitteeSummary[];
  // Last committed round, used to place "now" inside the running committee's
  // voting period. Null when the node could not be reached.
  currentRound: number | null;
}

const committeeHref = (id: string) => `/committee/${id}`;

const toDate = (seconds: number | null): Date | null =>
  seconds !== null ? new Date(seconds * 1000) : null;

// The display strings every variant of the row shares.
function rowValues(committee: CommitteeSummary) {
  return {
    headline: formatDateRange(
      toDate(committee.activeStart),
      toDate(committee.activeEnd),
    ),
    activeRounds:
      committee.periodEnd !== null
        ? formatRoundsRange(
            committee.periodEnd,
            committee.periodEnd + ACTIVE_PERIOD_BLOCKS,
          )
        : null,
    prodRounds: formatRoundsRange(
      committee.periodStart ?? undefined,
      committee.periodEnd ?? undefined,
    ),
    prodDates: formatDateRange(
      toDate(committee.prodStart),
      toDate(committee.prodEnd),
    ),
  };
}

// How far through its 1M-round voting period the running committee is. Null
// unless both the period and the chain's current round are known — a term
// progress bar is only worth showing when it is real.
function termProgress(
  committee: CommitteeSummary,
  currentRound: number | null,
) {
  if (committee.periodEnd === null || currentRound === null) return null;

  const elapsed = currentRound - committee.periodEnd;
  const ratio = Math.min(1, Math.max(0, elapsed / ACTIVE_PERIOD_BLOCKS));
  const remaining = Math.max(
    0,
    committee.periodEnd + ACTIVE_PERIOD_BLOCKS - currentRound,
  );

  return { width: `${(ratio * 100).toFixed(1)}%`, remaining };
}

function HowItWorksLink({ className }: { className?: string }) {
  return (
    <a
      href={COMMITTEE_SPEC_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "whitespace-nowrap font-semibold text-algo-blue hover:underline dark:text-algo-teal",
        className,
      )}
    >
      How this works ↗
    </a>
  );
}

/**
 * The committee currently declared on the Registry, as the page's hero: the term
 * it is serving, how far through it is, and the id everything else hangs off.
 */
function CommitteeHero({
  committee,
  currentRound,
  yourVotes,
}: {
  committee: CommitteeSummary;
  currentRound: number | null;
  yourVotes?: number;
}) {
  const { headline, activeRounds, prodRounds } = rowValues(committee);
  const progress = termProgress(committee, currentRound);
  const endsOn = toDate(committee.activeEnd);

  const stats = [
    { label: "Members", value: committee.members.toLocaleString() },
    { label: "Total votes", value: committee.votes.toLocaleString() },
    { label: "Proposals", value: committee.proposals.toLocaleString() },
    ...(yourVotes !== undefined
      ? [{ label: "Your votes", value: yourVotes.toLocaleString() }]
      : []),
  ];

  return (
    <section className="rounded-2xl bg-algo-blue p-5 text-white md:p-9 dark:bg-algo-teal dark:text-algo-black">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.08em] text-white/60 md:text-xs dark:text-algo-black/60">
              {committee.active ? "Current committee" : "Latest committee"}
            </span>
            {committee.active ? (
              <span className="inline-flex items-center rounded-full bg-algo-green px-2.5 py-0.5 text-xs font-bold text-algo-black dark:bg-algo-black dark:text-algo-green">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-algo-black/15 dark:text-algo-black">
                Ended
              </span>
            )}
          </div>

          <h1 className="text-[26px] font-bold leading-[1.08] tracking-[-0.02em] md:text-[38px]">
            {headline ?? activeRounds ?? "Committee"}
          </h1>

          {committee.idBase64 && (
            <CommitteeIdChip
              committeeId={committee.idBase64}
              className="mt-1.5 w-full max-w-[420px] self-start"
            />
          )}

          <div className="font-mono text-[12.5px] leading-relaxed tabular-nums text-white/70 md:text-sm dark:text-algo-black/70">
            {activeRounds && <>Voting rounds {activeRounds}</>}
            {activeRounds && prodRounds && (
              <span className="hidden md:inline"> · </span>
            )}
            {activeRounds && prodRounds && <br className="md:hidden" />}
            {prodRounds && <>Blocks counted {prodRounds}</>}
          </div>

          {progress && (
            <div className="mt-3 flex w-full max-w-[420px] flex-col gap-1.5">
              <div className="flex justify-between text-[12.5px] tabular-nums text-white/75 dark:text-algo-black/75">
                <span>Term progress</span>
                <span>{progress.width}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/20 dark:bg-algo-black/20">
                <div
                  className="h-full rounded-full bg-algo-green dark:bg-algo-black"
                  style={{ width: progress.width }}
                />
              </div>
              <div className="text-[12.5px] tabular-nums text-white/70 dark:text-algo-black/70">
                {progress.remaining.toLocaleString()} rounds left
                {endsOn && <> · ends {format(endsOn, "MMM d, yyyy")}</>}
              </div>
            </div>
          )}
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-4 border-t border-white/20 pt-5 md:gap-x-10 lg:gap-x-10 lg:gap-y-[22px] lg:border-0 lg:pt-0 dark:border-algo-black/20">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="mb-1 text-[11px] uppercase tracking-[0.06em] text-white/55 md:text-[11.5px] dark:text-algo-black/60">
                {stat.label}
              </dt>
              <dd className="text-[21px] font-bold leading-none tabular-nums md:text-[26px]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const LIST_COLUMNS =
  "grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,190px)]";

// The two bars are shades of one brand colour so the active committee's green
// is the only hue on the axis: pale-over-solid blue on white, dim-over-bright
// violet on the dark card.
const PROD_BAR = "bg-algo-blue-20 dark:bg-algo-blue-70";
const VOTE_BAR = "bg-algo-blue dark:bg-algo-blue-30";
const ACTIVE_BAR = "bg-algo-green";

function AxisLegend() {
  const items = [
    { className: PROD_BAR, label: "Blocks counted (3M)" },
    { className: VOTE_BAR, label: "Voting period (1M)" },
    { className: ACTIVE_BAR, label: "Active now" },
  ];

  return (
    <div className="flex shrink-0 flex-col gap-2 text-[13px] text-algo-black-70 dark:text-gray-400">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2.5">
          <span className={cn("h-2 w-6 rounded-sm", item.className)} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/**
 * The two round ranges a committee spans, drawn on the axis shared by every row:
 * the pale bar is the 3M blocks its members and votes are counted from, the
 * solid bar the 1M blocks it votes in. Adjacent rows overlap by two thirds,
 * which is the point of drawing them together.
 */
function CommitteeTrack({
  committee,
  axis,
}: {
  committee: CommitteeSummary;
  axis: CommitteeAxis;
}) {
  const { periodStart, periodEnd } = committee;

  return (
    <div className="relative h-[34px]">
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${axis.ticks.length}, minmax(0, 1fr))`,
        }}
      >
        {axis.ticks.map((tick) => (
          <span
            key={tick.round}
            className="border-l border-black/[0.08] dark:border-white/10"
          />
        ))}
      </div>

      {periodStart !== null && periodEnd !== null && (
        <>
          <div
            className={cn("absolute top-[11px] h-3 rounded-[4px]", PROD_BAR)}
            style={axisSpan(axis, periodStart, periodEnd)}
          />
          <div
            className={cn(
              "absolute top-[7px] h-5 rounded-[5px]",
              committee.active ? ACTIVE_BAR : VOTE_BAR,
            )}
            style={axisSpan(axis, periodEnd, periodEnd + ACTIVE_PERIOD_BLOCKS)}
          />
        </>
      )}
    </div>
  );
}

function TimelineRow({
  committee,
  axis,
}: {
  committee: CommitteeSummary;
  axis: CommitteeAxis;
}) {
  const { headline, activeRounds } = rowValues(committee);

  return (
    <a
      href={committeeHref(committee.id)}
      className={cn(
        "group grid items-center gap-6 border-b border-black/[0.08] py-[15px] transition-colors hover:bg-algo-blue-10/40 dark:border-white/10 dark:hover:bg-white/5",
        LIST_COLUMNS,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="text-[17px] font-bold tracking-[-0.01em] text-algo-black transition-colors group-hover:text-algo-blue dark:text-white dark:group-hover:text-algo-teal">
            {headline ?? activeRounds ?? "Unknown period"}
          </span>
          {committee.active && <CommitteeStatusBadge active />}
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[12.5px] text-algo-black-70 dark:text-gray-400">
          <span className="shrink-0 font-mono tabular-nums">
            {activeRounds ?? "—"}
          </span>
          {committee.idBase64 && (
            <>
              <span className="text-algo-black-30 dark:text-white/20">·</span>
              <CommitteeIdLabel committeeId={committee.id} />
            </>
          )}
        </div>
      </div>

      <CommitteeTrack committee={committee} axis={axis} />

      <div className="text-right">
        <div className="text-[19px] font-bold tabular-nums text-algo-black dark:text-white">
          {committee.members.toLocaleString()}
        </div>
        <div className="text-[13px] tabular-nums text-algo-black-50 dark:text-gray-500">
          {committee.votes.toLocaleString()} votes
        </div>
      </div>
    </a>
  );
}

function StackedRow({
  committee,
  yourVotes,
}: {
  committee: CommitteeSummary;
  yourVotes?: number;
}) {
  const { headline, activeRounds, prodRounds, prodDates } =
    rowValues(committee);

  return (
    <a
      href={committeeHref(committee.id)}
      className="group flex gap-3.5 border-t border-black/[0.08] py-4 transition-colors hover:bg-algo-blue-10/40 dark:border-white/10 dark:hover:bg-white/5"
    >
      <CommitteeAccentBar
        active={committee.active}
        className="w-1 self-stretch"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-algo-black transition-colors group-hover:text-algo-blue dark:text-white dark:group-hover:text-algo-teal">
              {headline ?? activeRounds ?? "Unknown period"}
            </span>
            <CommitteeStatusBadge active={committee.active} />
          </div>
          <div className="flex min-w-0 items-center gap-2 text-xs tabular-nums text-algo-black-70 dark:text-gray-400">
            <span className="shrink-0">
              {activeRounds ? `Voting rounds ${activeRounds}` : "—"}
            </span>
            {committee.idBase64 && (
              <>
                <span className="text-algo-black-30 dark:text-white/20">·</span>
                <CommitteeIdLabel committeeId={committee.id} />
              </>
            )}
          </div>
          {prodRounds && (
            <div className="text-xs leading-relaxed text-algo-black-50 dark:text-gray-500">
              Blocks counted <span className="tabular-nums">{prodRounds}</span>
              {prodDates && <> · {prodDates}</>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <CommitteeMetric label="Members" emphasized>
            {committee.members.toLocaleString()}
          </CommitteeMetric>
          <CommitteeMetric label="Total votes" emphasized>
            {committee.votes.toLocaleString()}
          </CommitteeMetric>
          <CommitteeMetric label="Proposals">
            {committee.proposals.toLocaleString()}
          </CommitteeMetric>
          {yourVotes !== undefined && (
            <CommitteeMetric label="Your votes" accent={yourVotes > 0}>
              {yourVotes > 0 ? yourVotes.toLocaleString() : "—"}
            </CommitteeMetric>
          )}
        </div>
      </div>
    </a>
  );
}

export function CommitteesIndex({
  committees,
  currentRound,
}: CommitteesIndexProps) {
  const { activeAddress } = useWallet();

  // Only committees published under their own id can be looked up by id; a
  // round-keyed copy has no id to attribute votes to.
  const committeeIds = useMemo(
    () =>
      committees
        .map((committee) => committee.idBase64)
        .filter((id): id is string => id !== null),
    [committees],
  );
  const votes = useCommitteeVotes(activeAddress, committeeIds);

  // "Your votes" is a column only once there is an address to attribute it to.
  const yourVotesFor = (committee: CommitteeSummary) =>
    activeAddress ? (votes.data?.[committee.id] ?? 0) : undefined;

  const axis = useMemo(() => buildCommitteeAxis(committees), [committees]);
  const featured =
    committees.find((committee) => committee.active) ?? committees[0];

  if (committees.length === 0) {
    return (
      <p className="text-[15px] text-algo-black-50 dark:text-gray-400">
        No committee has been published yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {featured && (
        <CommitteeHero
          committee={featured}
          currentRound={currentRound}
          yourVotes={yourVotesFor(featured)}
        />
      )}

      {network !== "mainnet" && (
        <p className="text-[15px] text-algo-black-50 dark:text-gray-400">
          Committee membership is only meaningful on mainnet.
        </p>
      )}

      <section className="rounded-2xl border border-black/[0.08] bg-white p-5 md:p-8 dark:border-white/10 dark:bg-algo-black-90">
        <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-start md:justify-between md:gap-8">
          <div>
            <h2 className="text-xl font-bold text-algo-black md:text-[22px] dark:text-white">
              All committees{" "}
              <span className="font-normal text-algo-black-50 dark:text-gray-500">
                ({committees.length})
              </span>
            </h2>
            <p className="mt-2 max-w-[660px] text-sm leading-relaxed text-algo-black-70 md:text-[15px] dark:text-gray-400">
              Terms run back to back. A committee votes for 1M blocks, and its
              members and their votes come from the 3M blocks immediately before
              — so adjacent committees share two thirds of the window they are
              counted from. <HowItWorksLink className="lg:hidden" />
            </p>
          </div>
          <div className="hidden lg:block">
            <AxisLegend />
          </div>
        </div>

        {/* Wide screens — one shared round axis, so the overlap between
            consecutive terms is visible at a glance */}
        {axis && (
          <div className="hidden lg:block">
            <div
              className={cn(
                "grid gap-6 border-b border-black/[0.14] pb-2.5 text-xs uppercase tracking-[0.06em] text-algo-black-50 dark:border-white/15 dark:text-gray-500",
                LIST_COLUMNS,
              )}
            >
              <span>Committee</span>
              <span>Rounds {axis.label}</span>
              <span className="text-right">Members · votes</span>
            </div>

            {committees.map((committee) => (
              <TimelineRow
                key={committee.id}
                committee={committee}
                axis={axis}
              />
            ))}

            <div className={cn("grid gap-6 pt-2.5", LIST_COLUMNS)}>
              <span />
              <div
                className="grid font-mono text-[11.5px] tabular-nums text-algo-black-50 dark:text-gray-500"
                style={{
                  gridTemplateColumns: `repeat(${axis.ticks.length}, minmax(0, 1fr))`,
                }}
              >
                {axis.ticks.map((tick) => (
                  <span key={tick.round}>{tick.label}</span>
                ))}
              </div>
              <span />
            </div>
          </div>
        )}

        {/* Narrow screens — the axis is dropped and each committee becomes the
            same stacked row the profile's voting-power list uses */}
        <div className={cn(axis && "lg:hidden")}>
          {committees.map((committee) => (
            <StackedRow
              key={committee.id}
              committee={committee}
              yourVotes={yourVotesFor(committee)}
            />
          ))}
        </div>

        <div className="mt-4 hidden border-t border-black/[0.08] pt-4 text-[13.5px] lg:flex dark:border-white/10">
          <span className="flex items-center gap-2 text-algo-black-50 dark:text-gray-500">
            <InfoIcon className="size-[15px]" strokeWidth={2} />
            Ranges are half-open and dates resolve from real block timestamps;
            an unreached end date is a projection.
          </span>
          <span className="ml-auto">
            <HowItWorksLink />
          </span>
        </div>
      </section>
    </div>
  );
}

export function CommitteesIndexIsland(props: CommitteesIndexProps) {
  return (
    <UseQuery>
      <UseWallet>
        <CommitteesIndex {...props} />
      </UseWallet>
    </UseQuery>
  );
}
