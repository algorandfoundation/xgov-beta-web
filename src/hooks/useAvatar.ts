import type { ProposalSummaryCardDetails } from "@/api";
import { useQuery } from "@tanstack/react-query";




export function useAvatar(proposal: ProposalSummaryCardDetails){

  // Fetch Discussion Users
  // Fetch NFD Users

  return useQuery({
    queryKey: ["getAvatar", proposal.proposer],
    queryFn: () => {
      return
    },
  })
}
