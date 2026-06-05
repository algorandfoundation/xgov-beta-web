import { useQuery } from "@tanstack/react-query";
import { getVotingHistory } from "@/api/voting-history";

export function useVotingHistory(
  xgovAddress: string | null | undefined,
  votingAddress?: string,
) {
  return useQuery({
    queryKey: ["getVotingHistory", xgovAddress, votingAddress],
    queryFn: () => getVotingHistory(xgovAddress!, votingAddress),
    enabled: !!xgovAddress,
    staleTime: 60_000,
  });
}
