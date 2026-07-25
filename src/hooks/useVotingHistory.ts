import { useQuery } from "@tanstack/react-query";
import { getVotingHistory } from "@/api/voting-history";

export function useVotingHistory(xgovAddress: string | null | undefined) {
  return useQuery({
    queryKey: ["getVotingHistory", xgovAddress],
    queryFn: () => getVotingHistory(xgovAddress!),
    enabled: !!xgovAddress,
    staleTime: 60_000,
  });
}
