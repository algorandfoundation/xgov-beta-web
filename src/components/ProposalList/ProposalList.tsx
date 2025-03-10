import { ProposalStatus, type ProposalSummaryCardDetails } from "@/types/proposals";
import { ProposalCard } from "../ProposalCard/ProposalCard";

export interface ProposalListProps {
  proposals: ProposalSummaryCardDetails[];
}

export function ProposalList({ proposals }: ProposalListProps) {
  // Filter out blocked proposals
  // They will still be visible in the Admin page
  const filteredProposals = proposals.filter(proposal => proposal.status !== ProposalStatus.ProposalStatusBlocked);

  if (filteredProposals.length === 0) {
    return (
      <p className="text-algo-black dark:text-white">No proposals yet</p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {filteredProposals.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} />
      ))}
    </ul>
  )
}