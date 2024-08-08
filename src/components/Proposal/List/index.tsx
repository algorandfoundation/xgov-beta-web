import type { ProposalSummaryCardDetails } from "@/types/proposals";
import { ProposalSummaryCard } from "@/components/Proposal/SummaryCard";

export interface ProposalListProps {
    proposals: ProposalSummaryCardDetails[];
}

export function ProposalList({ proposals }: ProposalListProps) {

    if (proposals.length === 0) {
        return (
            <p>No proposals yet</p>
        )
    }

    return (
        <ul className="flex flex-col gap-4">
            {proposals.map((proposal) => (
                <ProposalSummaryCard key={proposal.id} proposal={proposal} />
            ))}
        </ul>
    )
}