import { useQuery } from "@tanstack/react-query";
import { getBlockTimestamp } from "@/api/blocks";
import type { CommitteeVotingPower } from "@/api/committee";

// A committee is active for the 1M-block period that follows its block-production
// period, i.e. [periodEnd, periodEnd + ACTIVE_PERIOD_BLOCKS). Per the xGov spec.
export const ACTIVE_PERIOD_BLOCKS = 1_000_000;

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

/**
 * Resolves the two date ranges each committee spans, from real block timestamps:
 *  - the block-production period [periodStart, periodEnd) where votes are counted;
 *  - the active period [periodEnd, periodEnd + 1M) when the committee votes.
 *
 * Production bounds are always in the past (block production is retroactive). The
 * active period's end is in the future for the currently-running committee, so it
 * is projected from the observed production block rate.
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
              return [
                committeeId,
                {
                  activeStart: null,
                  activeEnd: null,
                  prodStart: null,
                  prodEnd: null,
                },
              ];
            }

            const activeEndRound = periodEnd + ACTIVE_PERIOD_BLOCKS;
            const [startTs, prodEndTs, activeEndTs] = await Promise.all([
              getBlockTimestamp(periodStart),
              getBlockTimestamp(periodEnd),
              getBlockTimestamp(activeEndRound),
            ]);

            // The active period is still running when its end block doesn't exist
            // yet — project it forward from the observed production block rate.
            let activeEnd = activeEndTs;
            if (
              activeEndTs === null &&
              startTs !== null &&
              prodEndTs !== null &&
              periodEnd > periodStart
            ) {
              const rate = (prodEndTs - startTs) / (periodEnd - periodStart);
              activeEnd = prodEndTs + ACTIVE_PERIOD_BLOCKS * rate;
            }

            return [
              committeeId,
              {
                activeStart: toDate(prodEndTs),
                activeEnd: toDate(activeEnd),
                prodStart: toDate(startTs),
                prodEnd: toDate(prodEndTs),
              },
            ];
          },
        ),
      );

      return Object.fromEntries(entries);
    },
  });
}
