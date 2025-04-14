import { useQuery } from "@tanstack/react-query";
import { getAllProposals, getProposal, getProposalsByProposer, getVoterBox } from "src/api/proposals";

export function useGetAllProposals() {
    return useQuery({
        queryKey: ['getAllProposals'],
        queryFn: getAllProposals,
    });
}

export function useProposalsByProposer(address: string | null | undefined) {
    return useQuery({
        queryKey: ['getProposalsByProposer', address],
        queryFn: () => getProposalsByProposer(address!),
        enabled: !!address,
    });
}

export function useProposal(proposalId: number | null) {
    return useQuery({
        queryKey: ['getProposal', Number(proposalId!)],
        queryFn: () => getProposal(BigInt(proposalId!)),
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