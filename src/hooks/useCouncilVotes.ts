import { useQuery } from "@tanstack/react-query";
import { getCouncilVotes, getAllCouncilMembers } from "@/api";

export function useCouncilVotes(proposalId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["councilVotes", proposalId],
    queryFn: () => getCouncilVotes(proposalId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCouncilMembers() {
  return useQuery({
    queryKey: ["councilMembers"],
    queryFn: getAllCouncilMembers,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
