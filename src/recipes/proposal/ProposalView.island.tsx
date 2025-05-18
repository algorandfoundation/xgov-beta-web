import type { TypedGlobalState } from "@algorandfoundation/xgov/registry";
import { type ProposalMainCardDetails, type ProposalSummaryCardDetails, getDiscussionDuration } from "@/api";
import { useProposal, useProposalsByProposer, UseQuery, useRegistry, UseWallet } from "@/hooks";
import { ProposalInfo, StatusCard } from "@/recipes";
import { useWallet } from "@txnlab/use-wallet-react";

type ProposalInfoControllerProps = {
  xGovReviewer?: string;
  proposal: ProposalMainCardDetails;
  pastProposals: ProposalSummaryCardDetails[];
  children: React.ReactNode;
};

export function ProposalInfoController({ xGovReviewer, proposal, pastProposals, children }: ProposalInfoControllerProps) {
  const { activeAddress } = useWallet();
  const proposalQuery = useProposal(proposal.id, proposal);
  const pastProposalsQuery = useProposalsByProposer(activeAddress, pastProposals);
  
  const _proposal = proposalQuery.data || proposal;
  const _pastProposals = pastProposalsQuery.data || pastProposals;

  return (
    <ProposalInfo
      activeAddress={activeAddress}
      xGovReviewer={xGovReviewer}
      proposal={_proposal}
      pastProposals={_pastProposals}
    >
      {children}
    </ProposalInfo>
  )
}

export function ProposalInfoIsland(props: ProposalInfoControllerProps) {
  return (
    <UseQuery>
      <UseWallet>
        <ProposalInfoController {...props} />
      </UseWallet>
    </UseQuery>
  );
}

type StatusCardControllerProps = {
  proposal: ProposalMainCardDetails;
  registry: TypedGlobalState;
};

export function ViewProposalController({
  registry,
  proposal,
}: StatusCardControllerProps) {
  const registryQuery = useRegistry(registry);
  const proposalQuery = useProposal(proposal.id, proposal);

  const _proposal = proposalQuery.data || proposal;
  const _registry = registryQuery.data || registry;

  const _discussionDuration = Date.now() - Number(_proposal.submissionTs) * 1000;
  const _minimumDiscussionDuration =
    getDiscussionDuration(proposal.fundingCategory, _registry.discussionDuration) *
    1000;

  return (
    <StatusCard
      proposal={_proposal}
      discussionDuration={_discussionDuration}
      minimumDiscussionDuration={_minimumDiscussionDuration}
      quorums={_registry.quorum}
      weightedQuorums={_registry.weightedQuorum}
      votingDurations={_registry.votingDuration}
    />
  );
}

export function StatusCardIsland(props: StatusCardControllerProps) {
  return (
    <UseQuery>
      <UseWallet>
        <ViewProposalController {...props} />
      </UseWallet>
    </UseQuery>
  );
}
