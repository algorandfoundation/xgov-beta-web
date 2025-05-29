import { type ProposalMainCardDetails, type ProposalSummaryCardDetails, type RegistryGlobalState, getDiscussionDuration } from "@/api";
import { useProposal, useProposalsByProposer, UseQuery, useRegistry, UseWallet } from "@/hooks";
import { ProposalInfo, StatusCard } from "@/recipes";
import { useWallet } from "@txnlab/use-wallet-react";
import { navigate } from "astro/virtual-modules/transitions-router.js";
import { useEffect } from "react";

type ProposalInfoControllerProps = {
  xGovReviewer?: string;
  proposal: ProposalMainCardDetails;
  pastProposals: ProposalSummaryCardDetails[];
  children: React.ReactNode;
};

export function ProposalInfoController({ xGovReviewer, proposal, pastProposals, children }: ProposalInfoControllerProps) {
  const { activeAddress } = useWallet();
  const proposalQuery = useProposal(proposal.id, proposal);
  const pastProposalsQuery = useProposalsByProposer(proposal.proposer, pastProposals);

  const _proposal = proposalQuery.data || proposal;
  const _pastProposals = pastProposalsQuery.data || pastProposals;

  useEffect(() => {
    if (
      _proposal.proposer === activeAddress &&
      !!!_proposal.forumLink
    ) {
      // If the proposal is created by the active address and does not have a forum link, redirect to create a proposal
      navigate(`/new`);
    }
  }, [activeAddress, _proposal]);

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
  registry: RegistryGlobalState;
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
    getDiscussionDuration(proposal.fundingCategory, [
      _registry.discussionDurationLarge || 0n,
      _registry.discussionDurationMedium || 0n,
      _registry.discussionDurationSmall || 0n,
      _registry.discussionDurationXlarge || 0n,
    ]) *
    1000;

  return (
    <StatusCard
      proposal={_proposal}
      discussionDuration={_discussionDuration}
      minimumDiscussionDuration={_minimumDiscussionDuration}
      quorums={[
        _registry.quorumSmall || 0n,
        _registry.quorumMedium || 0n,
        _registry.quorumLarge || 0n,
      ]}
      weightedQuorums={[
        _registry.weightedQuorumSmall || 0n,
        _registry.weightedQuorumMedium || 0n,
        _registry.weightedQuorumLarge || 0n,
      ]}
      votingDurations={[
        _registry.votingDurationSmall || 0n,
        _registry.votingDurationMedium || 0n,
        _registry.votingDurationLarge || 0n,
        _registry.votingDurationXlarge || 0n,
      ]}
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
