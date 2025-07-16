import { getProposalVoters } from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useProposalVoters(id: number, enabled: boolean = true, limit?: number){
  return useQuery({
    queryKey: ["useProposalVoters", id],
    queryFn: () => getProposalVoters(id, limit),
    enabled,
  })
}
