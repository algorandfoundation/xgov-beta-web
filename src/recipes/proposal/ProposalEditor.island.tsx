import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";
import { z } from "zod";

import { updateMetadata, type ProposalMainCardDetails } from "@/api";
import { proposalFormSchema, ProposalForm } from "@/recipes";
import { UseQuery, useRegistry, UseWallet } from "@/hooks";
import { useState } from "react";
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";

export type EditProposalProps = {
  proposal?: ProposalMainCardDetails;
};
export function EditProposalIsland({ proposal }: EditProposalProps) {
  return (
    <UseWallet>
      <UseQuery>
        <EditProposalForm proposal={proposal} />
      </UseQuery>
    </UseWallet>
  );
}

export function EditProposalForm({
  proposal,
}: {
  proposal?: ProposalMainCardDetails;
}) {
  const { activeAddress, transactionSigner } = useWallet();
  const registry = useRegistry();
  const [editProposalLoading, setEditProposalLoading] = useState(false);
  const [editProposalError, setEditProposalError] = useState<string | null>(null);

  return (
    <ProposalForm
      type="edit"
      proposal={proposal}
      loading={editProposalLoading}
      onSubmit={async (data: z.infer<typeof proposalFormSchema>) => {
        if (!activeAddress) {
          console.error("No active address");
          return;
        }

        if (!proposal) {
          console.error("No current proposal");
          return;
        }

        if (!registry.data?.proposalCommitmentBps) {
          console.error("No proposal commitment bps");
          return;
        }

        const requestedAmount = AlgoAmount.Algos(
          BigInt(data.requestedAmount),
        ).microAlgos;

        const metadataOnlyChange = data.title === proposal.title && Number(data.fundingType) === proposal.fundingType && requestedAmount === proposal.requestedAmount && Number(data.focus) === proposal.focus;

        if (!metadataOnlyChange) {  
          console.error("Proposal metadata can only be edited, not funding or focus");
        }

        try {
          await updateMetadata(
            activeAddress,
            data,
            transactionSigner,
            proposal,
            setEditProposalLoading,
            setEditProposalError
          )

          navigate(`/proposal/${proposal.id}`);
        } catch (e) {
          console.error(e);
          console.error("Failed to update proposal");
        }
      }}
    />
  );
}
