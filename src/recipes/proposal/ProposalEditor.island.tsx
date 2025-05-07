import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";
import { z } from "zod";

import { updateProposal, type ProposalMainCardDetails } from "@/api";
import { proposalFormSchema, ProposalForm } from "@/recipes";
import { UseQuery, useRegistry, UseWallet } from "@/hooks";
import { useState } from "react";

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
  const [createProposalPending, setCreateProposalPending] = useState(false);

  return (
    <ProposalForm
      type="edit"
      proposal={proposal}
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

        try{
          await updateProposal(
            activeAddress,
            data,
            transactionSigner,
            proposal,
            registry.data?.proposalCommitmentBps,
            setCreateProposalPending
          );
          navigate(`/proposal/${proposal.id}`);
        } catch (e) {
          console.error(e);
          console.error("Failed to update proposal");
        }
      }}
      createProposalPending={createProposalPending}
    />
  );
}
