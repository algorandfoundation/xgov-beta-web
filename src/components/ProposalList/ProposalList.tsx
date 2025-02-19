import { ProposalStatus, type ProposalSummaryCardDetails } from "@/types/proposals";
import { ProposalCard } from "../ProposalCard/ProposalCard";
import { useWallet } from "@txnlab/use-wallet-react";

export interface ProposalListProps {
    proposals: ProposalSummaryCardDetails[];
}

export function ProposalList({ proposals }: ProposalListProps) {
    const { activeAddress } = useWallet();

    // Filter out blocked proposals
    // They will be visible in the Admin page
    const filteredProposals = proposals.filter(proposal => proposal.status !== ProposalStatus.ProposalStatusBlocked);

    if (filteredProposals.length === 0) {
        return (
            <p className="text-algo-black dark:text-white">No proposals yet</p>
        )
    }

    return (
        <ul className="flex flex-col gap-4">
            {filteredProposals.map((proposal) => {
                return <ProposalCard key={proposal.id} proposal={proposal} isOwner={proposal.proposer == activeAddress} />;
            })}
        </ul>
    )
}