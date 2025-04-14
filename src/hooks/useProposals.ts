import { useQuery } from "@tanstack/react-query";
import {
  getAllProposals,
  getProposal,
  getProposalsByProposer,
  type ProposalMainCardDetails,
} from "@/api";
import type { ProposalSummaryCardDetails } from "@/api";

export function useGetAllProposals(proposals?: ProposalSummaryCardDetails[]) {
  return useQuery({
    queryKey: ["getAllProposals"],
    queryFn: getAllProposals,
    // Hydrate data
    initialData: proposals,
    // Allow staleness
    staleTime: 100,
  });
}

export function useProposalsByProposer(
  address: string | null | undefined,
  proposals?: ProposalMainCardDetails[],
) {
  return useQuery({
    queryKey: ["getProposalsByProposer", address],
    queryFn: () => getProposalsByProposer(address!),
    initialData: proposals,
    staleTime: 100,
    enabled: !!address,
  });
}

export function useProposal(
  proposalId: number | bigint | null,
  proposal?: ProposalMainCardDetails,
) {
  return useQuery({
    queryKey: ["getProposal", Number(proposalId!)],
    queryFn: () => getProposal(BigInt(proposalId!)),
    initialData: proposal,
    staleTime: 100,
    enabled: !!proposalId,
  });
}
