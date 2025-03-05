import type { ProposalSummaryCardDetails } from "@/types/proposals";
import { ProposalCard } from "../ProposalCard/ProposalCard";

export interface ProposalListProps {
    proposals: ProposalSummaryCardDetails[];
}

export function ProposalList({ proposals }: ProposalListProps) {

    if (proposals.length === 0) {
        return (
            <p className="text-algo-black dark:text-white">No proposals yet</p>
        )
    }

    return (
        <ul className="w-full flex flex-col gap-2">
            {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
        </ul>
    )
}