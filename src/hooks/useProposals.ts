import { useQuery } from "@tanstack/react-query";
import { getAllProposals, getProposal, getProposalBrief, getProposalsByProposer } from "src/api/proposals";

export function useGetAllProposals() {
    return useQuery({
        queryKey: ['getAllProposals'],
        queryFn: getAllProposals,
    });
}

export function useProposalsByProposer(address: string | null) {
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

export function useProposalBrief(pastProposalLinks: bigint[] | undefined) {
    console.log('pastProposalLinks', pastProposalLinks);
    return useQuery({
        queryKey: ['getProposalBrief', pastProposalLinks],
        queryFn: () => getProposalBrief(pastProposalLinks!),
        enabled: !!pastProposalLinks && pastProposalLinks.length > 0
    });
}

