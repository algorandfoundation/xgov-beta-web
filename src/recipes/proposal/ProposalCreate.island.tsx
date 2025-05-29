import { useProposalsByProposer, UseQuery, useRegistry, UseWallet } from "@/hooks";
import { ProposalForm, proposalFormSchema } from "@/recipes";
import { createProposal, ProposalStatus, submitProposal } from "@/api";
import { useWallet } from "@txnlab/use-wallet-react";
import { useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import { z } from "zod";
import { useBalance } from "@/hooks/useBalance";

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
  const { activeAddress, transactionSigner, activeWallet } = useWallet();
  const userBalance = useBalance(activeAddress);
  const registry = useRegistry();
  const proposalsData = useProposalsByProposer(activeAddress);
  const [proposalSubmitLoading, setProposalSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const emptyProposals =
    !!proposalsData.data &&
    proposalsData.data?.filter(
      (proposal) => proposal.status === ProposalStatus.ProposalStatusEmpty,
    );
  const emptyProposal =
    emptyProposals && emptyProposals.length > 0 ? emptyProposals[0] : null;
  
  const appId = emptyProposal?.id || null;

  const currentProposals =
    !!proposalsData.data &&
    proposalsData.data?.filter((proposal) =>
      activeProposalTypes.includes(proposal.status),
    );
  const currentProposal =
    currentProposals && currentProposals.length > 0 && currentProposals[0];

  const maxRequestedAmount = (!!userBalance.data?.available && userBalance.data.available.microAlgos > 1_000n) ? userBalance.data.available.microAlgos - 1_000n : 0n;

  useEffect(() => {
    if (currentProposal) {
      navigate(`/proposal/${currentProposal.id}`);
    }
  }, [currentProposal]);

  return (
    <ProposalForm
      type="create"
      bps={registry.data?.proposalCommitmentBps || 0n}
      maxRequestedAmount={maxRequestedAmount}
      loading={proposalSubmitLoading}
      error={submitError || undefined}
      onSubmit={async (data: z.infer<typeof proposalFormSchema>) => {
        if (!activeAddress) {
          console.error("No active address");
          return;
        }

        if (!activeWallet) {
          console.error("No active wallet");
          return;
        }

        if (!registry.data?.proposalCommitmentBps) {
          console.error("No proposal commitment bps");
          return;
        }

        if (!appId) {
          console.error("No appId set for Lute proposal");
          return;
        }

        try {
          await submitProposal(
            activeAddress,
            data,
            transactionSigner,
            appId,
            registry.data?.proposalCommitmentBps,
            setProposalSubmitLoading,
          )

          navigate(`/proposal/${appId}`);
        } catch (e) {
          console.error(e);
          console.error("Failed to submit proposal");
          setSubmitError("Failed to submit proposal. Please try again.");
        }
      }}
    />
  );
}
