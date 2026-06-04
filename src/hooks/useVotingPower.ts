import { useQuery } from "@tanstack/react-query";
import { getVotingPowerForAddress } from "@/api/committee";
import { useGetAllProposals } from "./useProposals";
import { useMemo } from "react";

export function useVotingPower(address: string | null | undefined) {
  const proposalsQuery = useGetAllProposals();

  const committeeIds = useMemo(() => {
    if (!proposalsQuery.data) return { ids: [], keys: [] as string[] };

    const seen = new Set<string>();
    const ids: Uint8Array[] = [];
    const keys: string[] = [];

    for (const proposal of proposalsQuery.data) {
      if (!proposal.committeeId || proposal.committeeId.length === 0) continue;
      const key = Buffer.from(proposal.committeeId).toString("base64");
      if (!seen.has(key)) {
        seen.add(key);
        ids.push(proposal.committeeId);
        keys.push(key);
      }
    }

    return { ids, keys };
  }, [proposalsQuery.data]);

  return useQuery({
    queryKey: ["votingPower", address, committeeIds.keys],
    queryFn: () => getVotingPowerForAddress(address!, committeeIds.ids),
    enabled: !!address && committeeIds.ids.length > 0,
    staleTime: 30_000,
  });
}
