import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";
import { z } from "zod";

import { updateProposal, type ProposalMainCardDetails } from "@/api";
import { proposalFormSchema, ProposalForm } from "@/recipes";
import { UseWallet } from "@/hooks";

export type EditProposalProps = {
  proposal?: ProposalMainCardDetails;
};
export function EditProposalIsland({ proposal }: EditProposalProps) {
  return (
    <UseWallet>
      <EditProposalForm proposal={proposal} />
    </UseWallet>
  );
}

export function EditProposalForm({
  proposal,
}: {
  proposal?: ProposalMainCardDetails;
}) {
  const { activeAddress, transactionSigner } = useWallet();
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

        try{
          await updateProposal(activeAddress, data, transactionSigner, proposal)
          navigate(`/proposal/${proposal.id}`);
        } catch (e) {
          console.error(e);
          console.error("Failed to update proposal");
        }
      }}
    />
  );
}
