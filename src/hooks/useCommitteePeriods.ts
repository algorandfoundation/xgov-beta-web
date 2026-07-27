import { useQuery } from "@tanstack/react-query";
import { getBlockTimestamp } from "@/api/blocks";
import {
  ACTIVE_PERIOD_BLOCKS,
  resolveCommitteePeriod,
  type CommitteeVotingPower,
} from "@/api/committee";

export { ACTIVE_PERIOD_BLOCKS };

export interface CommitteePeriod {
  // Active period [periodEnd, periodEnd + 1M) — the primary (headline) range.
  activeStart: Date | null;
  activeEnd: Date | null;
  // Block-production period [periodStart, periodEnd) — "blocks counted".
  prodStart: Date | null;
  prodEnd: Date | null;
}

export type CommitteePeriodMap = Record<string, CommitteePeriod>;

const toDate = (ts: number | null): Date | null =>
  ts !== null ? new Date(ts * 1000) : null;

const EMPTY_PERIOD: CommitteePeriod = {
  activeStart: null,
  activeEnd: null,
  prodStart: null,
  prodEnd: null,
};

/**
 * Resolves the active and block-production date ranges of each committee from
 * real block timestamps. See `resolveCommitteePeriod` for the projection rules.
 */
export function useCommitteePeriods(committees: CommitteeVotingPower[]) {
  // Stable key from every round we need to resolve.
  const roundsKey = committees
    .flatMap((c) =>
      c.periodStart !== undefined && c.periodEnd !== undefined
        ? [c.periodStart, c.periodEnd, c.periodEnd + ACTIVE_PERIOD_BLOCKS]
        : [],
    )
    .sort((a, b) => a - b);

  return useQuery({
    queryKey: ["committeePeriods", roundsKey],
    enabled: committees.length > 0,
    // Block timestamps are immutable; keep resolved periods for the session.
    staleTime: Infinity,
    queryFn: async (): Promise<CommitteePeriodMap> => {
      const entries = await Promise.all(
        committees.map(
          async (committee): Promise<[string, CommitteePeriod]> => {
            const { committeeId, periodStart, periodEnd } = committee;
            if (periodStart === undefined || periodEnd === undefined) {
              return [committeeId, EMPTY_PERIOD];
            }

            // Only the currently-running (newest) committee should have a missing
            // activeEnd block; avoid projecting ended committees when a lookup
            // fails transiently.
            const newestPeriodStart = Math.max(
              ...committees.map((c) => c.periodStart ?? -1),
            );

            const period = await resolveCommitteePeriod(
              periodStart,
              periodEnd,
              getBlockTimestamp,
              periodStart === newestPeriodStart,
            );

            return [
              committeeId,
              {
                activeStart: toDate(period.activeStart),
                activeEnd: toDate(period.activeEnd),
                prodStart: toDate(period.prodStart),
                prodEnd: toDate(period.prodEnd),
              },
            ];
          },
        ),
      );

      return Object.fromEntries(entries);
    },
  });
}
