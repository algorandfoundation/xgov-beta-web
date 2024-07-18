import ProposalCard from "./ProposalCard";
import type { ProposalCardDetails } from "../types/proposals";

export interface ProposalListProps {
    proposals: ProposalCardDetails[];
}

export default function ProposalList({ proposals }: ProposalListProps) {
return (
    <>
        <h2 className="text-2xl lg:text-4xl font-bold py-2 mb-2">Active Proposals</h2>
        {
            proposals.length === 0 ? (
                <p>No proposals yet</p>
            ) : (
                <ul className="flex flex-col gap-4">
                    {proposals.map((proposal) => (
                        <ProposalCard proposal={proposal} />
                    ))}
                </ul>
            )
        }
    </>
)
}