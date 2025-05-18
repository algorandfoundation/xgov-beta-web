import { useQuery } from "@tanstack/react-query";
import {
  getAllProposals,
  getProposal,
  getProposalsByProposer,
  getVoterBox,
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
  proposals?: ProposalSummaryCardDetails[],
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

export function useVoterBox(proposalId: number | null, activeAddress: string | null) {
    return useQuery({
        queryKey: ['getVoterBox', Number(proposalId!), activeAddress],
        queryFn: () => getVoterBox(BigInt(proposalId!), activeAddress!),
        enabled: !!proposalId && !!activeAddress,
    });
}