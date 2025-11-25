import { useQuery } from "@tanstack/react-query";
import {
  getAllProposals,
  getMetadata,
  getProposal,
  getProposalsByProposer,
  getVoterBox,
  getVotersInfo,
  type ProposalMainCardDetails,
} from "@/api";
import type { ProposalSummaryCardDetails } from "@/api";
import { getCommitteeData, getXGovCommitteeMap, type CommitteeMember } from "@/api/committee";

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

export function useVoterBox(proposalId: bigint | null, activeAddress: string | null) {
  return useQuery({
    queryKey: ['getVoterBox', Number(proposalId!), activeAddress],
    queryFn: () => getVoterBox(BigInt(proposalId!), activeAddress!),
    enabled: !!proposalId && !!activeAddress,
  });
}

export function useCommittee(committeeByteArray: Uint8Array<ArrayBufferLike> | undefined) {
  return useQuery({
    queryKey: ['getCommittee', committeeByteArray],
    queryFn: () => getXGovCommitteeMap(Buffer.from(committeeByteArray!)),
    enabled: !!committeeByteArray,
  })
}

export function useVotersInfo(proposalId: bigint | null, committeeSubset: CommitteeMember[] | null, enabled: boolean) {
  return useQuery({
    queryKey: ['getVotersInfo', proposalId, committeeSubset],
    queryFn: () => getVotersInfo(proposalId!, committeeSubset!),
    enabled,
  });
}

export function useMetadata(proposalId: bigint | null, enabled: boolean) {
  return useQuery({
    queryKey: ['getMetadata', proposalId],
    queryFn: () => getMetadata(proposalId!),
    enabled,
  });
}