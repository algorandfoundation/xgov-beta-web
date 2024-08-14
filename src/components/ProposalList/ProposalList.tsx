import type { ProposalSummaryCardDetails } from "@/types/proposals";
import { ProposalCard } from "../ProposalCard/ProposalCard";

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
                <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
        </ul>
    )
}