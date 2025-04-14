import { useProposalsByProposer, UseQuery, UseWallet } from "@/hooks";
import { ProposalForm, proposalFormSchema } from "@/recipes";
import { createProposal, ProposalStatus } from "@/api";
import { useWallet } from "@txnlab/use-wallet-react";
import { useEffect } from "react";
import { navigate } from "astro:transitions/client";
import { z } from "zod";
export function ProposalCreateIsland() {
  return (
    <UseQuery>
      <UseWallet>
        <ProposalCreate />
      </UseWallet>
    </UseQuery>
  );
}

const activeProposalTypes = [
  ProposalStatus.ProposalStatusDraft,
  ProposalStatus.ProposalStatusFinal,
  ProposalStatus.ProposalStatusVoting,
];

export function ProposalCreate() {
  const { activeAddress, transactionSigner } = useWallet();
  const proposalsData = useProposalsByProposer(activeAddress);

  const emptyProposals =
    !!proposalsData.data &&
    proposalsData.data?.filter(
      (proposal) => proposal.status === ProposalStatus.ProposalStatusEmpty,
    );
  const emptyProposal =
    emptyProposals && emptyProposals.length > 0 ? emptyProposals[0] : null;

  const currentProposals =
    !!proposalsData.data &&
    proposalsData.data?.filter((proposal) =>
      activeProposalTypes.includes(proposal.status),
    );
  const currentProposal =
    currentProposals && currentProposals.length > 0 && currentProposals[0];

  useEffect(() => {
    if (currentProposal) {
      navigate(`/proposal/${currentProposal.id}`);
    }
  }, [currentProposal]);

  return (
    <ProposalForm
      type="create"
      onSubmit={async (data: z.infer<typeof proposalFormSchema>) => {
        if (!activeAddress) {
          console.error("No active address");
          return;
        }
        try {
          const appId = await createProposal(
            activeAddress,
            data,
            transactionSigner,
            emptyProposal,
          );
          navigate(`/proposal/${appId}`);
        } catch (e) {
          console.error(e);
          console.error("Failed to create proposal");
        }
      }}
    />
  );
}
