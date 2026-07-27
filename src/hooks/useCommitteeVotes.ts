import { useQuery } from "@tanstack/react-query";
import { Buffer } from "buffer";
import { getVotingPowerForAddress } from "@/api/committee";

export type CommitteeVotesMap = Record<string, number>;

/**
 * The connected address's votes in each of the given committees, keyed by the
 * committee's safe-filename id.
 *
 * Unlike `useVotingPower`, the committees are supplied by the caller rather than
 * derived from the proposals that reference them — the committees index already
 * knows the full set, including those no proposal has been assigned to yet.
 *
 * @param address The address to look up, or null/undefined when none is connected
 * @param committeeIds Committee ids in their full base64 form
 */
export function useCommitteeVotes(
  address: string | null | undefined,
  committeeIds: string[],
) {
  return useQuery({
    queryKey: ["committeeVotes", address, committeeIds],
    enabled: !!address && committeeIds.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<CommitteeVotesMap> => {
      const power = await getVotingPowerForAddress(
        address!,
        committeeIds.map((id) => new Uint8Array(Buffer.from(id, "base64"))),
      );

      return Object.fromEntries(
        power.map((committee) => [committee.committeeId, committee.userVotes]),
      );
    },
  });
}
