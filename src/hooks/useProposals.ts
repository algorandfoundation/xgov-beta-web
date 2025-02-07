import { useQuery } from "@tanstack/react-query";
import { getAllProposals, getProposal, getProposalBrief, getProposalsByProposer } from "src/api/proposals";

export function useGetAllProposals() {
    return useQuery({
        queryKey: ['getAllProposals'],
        queryFn: getAllProposals,
    });
}

export function useProposalsByProposer(address: string | undefined) {
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