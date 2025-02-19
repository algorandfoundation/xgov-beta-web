import { ProposalStatus, type ProposalSummaryCardDetails } from "@/types/proposals";
import { ProposalCard } from "../ProposalCard/ProposalCard";

export interface ProposalListProps {
    proposals: ProposalSummaryCardDetails[];
    activeAddress: string;
    transactionSigner: any;
    refetcher: () => void;
}

export function ProposalList({ proposals, activeAddress, transactionSigner, refetcher }: ProposalListProps) {

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
            {filteredProposals.map((proposal) => (
                proposal.status !== ProposalStatus.ProposalStatusEmpty && (
                    <ProposalCard key={proposal.id} proposal={proposal} activeAddress={activeAddress} transactionSigner={transactionSigner} refetcher={refetcher} />
                )
            ))}
        </ul>
    )
}