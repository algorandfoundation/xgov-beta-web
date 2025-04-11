import type { TypedGlobalState } from "@algorandfoundation/xgov/registry";
import { type ProposalMainCardDetails, getDiscussionDuration } from "@/api";
import { useProposal, UseQuery, useRegistry, UseWallet } from "@/hooks";
import { StatusCard } from "@/recipes";

type ViewProposalProps = {
  proposal: ProposalMainCardDetails;
  registry: TypedGlobalState;
};
export function ViewProposalController({
  registry,
  proposal,
}: ViewProposalProps) {
  const registryQuery = useRegistry(registry);
  const proposalQuery = useProposal(proposal.id, proposal);

  const _proposal = proposalQuery.data || proposal;
  const _registry = registryQuery.data || registry;

  const _discussionDuration = Date.now() - _proposal.submissionTime * 1000;
  const _minimumDiscussionDuration =
    getDiscussionDuration(proposal.category, _registry.discussionDuration) *
    1000n;

  return (
    <StatusCard
      proposal={_proposal}
      discussionDuration={Number(_discussionDuration)}
      minimumDiscussionDuration={_minimumDiscussionDuration}
    />
  );
}

export function StatusCardIsland(props: ViewProposalProps) {
  return (
    <UseQuery>
      <UseWallet>
        <ViewProposalController {...props} />
      </UseWallet>
    </UseQuery>
  );
}
