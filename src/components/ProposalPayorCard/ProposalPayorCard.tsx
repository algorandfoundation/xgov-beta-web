import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  getProposalClientById,
  type ProposalMainCardDetails,
  ProposalStatus,
  registryClient,
  callUnassign,
  proposerBoxName,
} from "@/api";
import { UseWallet } from "@/hooks/useWallet.tsx";
import { useProposal, UseQuery } from "@/hooks";
import { CheckIcon } from "lucide-react";
import { Button } from "../ui/button";

export function PayorCardIsland({
  proposal,
}: {
  proposal: ProposalMainCardDetails;
}) {
  return (
    <UseQuery>
      <UseWallet>
        <ProposalPayorCard proposalId={proposal.id} status={proposal.status} />
      </UseWallet>
    </UseQuery>
  );
}
export function ProposalPayorCard({
  proposalId,
  status,
}: {
  proposalId: bigint;
  status: ProposalStatus;
}) {
  const { activeAddress, transactionSigner } = useWallet();
  const proposalQuery = useProposal(proposalId);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => setErrorMessage(""), []);

  const handlePayout = async () => {
    setErrorMessage("");
    const proposalClient = getProposalClientById(proposalId);
    const proposer = await proposalClient.state.global.proposer();

    if (!activeAddress || !proposalClient) {
      setErrorMessage(
        "Failed to get proposal client or active address is missing.",
      );
      return false;
    }

    if (proposer === undefined) {
      setErrorMessage("Failed to get proposer information.");
      return false;
    }

    try {
      const res = await registryClient.send.payGrantProposal({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          proposalId,
        },
        boxReferences: [proposerBoxName(proposer)],
        appReferences: [proposalId],
        accountReferences: [proposer],
        extraFee: (3_000).microAlgos(),
      });

      if (
        res.confirmation.confirmedRound !== undefined &&
        res.confirmation.confirmedRound > 0 &&
        res.confirmation.poolError === ""
      ) {
        console.log("Transaction confirmed");
        // call backend to unassign voters
        try {
          await callUnassign(proposalId);
        } catch (e) {
          console.warn("Failed to Unassign:", e);
        }
        setErrorMessage(null);
        proposalQuery.refetch();
        return true;
      }

      console.log("Transaction not confirmed");
      setErrorMessage("Transaction not confirmed.");
      return false;
    } catch (error) {
      console.error("Error during review:", error);
      setErrorMessage("An error occurred calling the proposal contract.");
      return false;
    }
  };

  return status !== ProposalStatus.ProposalStatusReviewed ? null : (
    <div>
      <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
        xGov Payor Panel
      </h1>
      <li
        role="listitem"
        className="list-none relative bg-algo-blue-20 dark:bg-algo-teal-20 text-algo-black p-4 rounded-lg max-w-xl"
      >
        <div className="max-w-3xl">
          <div>
            <h2 className="text-xl mt-2 mb-4">Pay out this proposal?</h2>
            <div className="flex flex-row gap-2">
              <Button onClick={() => handlePayout()} variant="success">
                <CheckIcon className="text-white group-hover:text-algo-green transition" />
                Pay out
              </Button>
            </div>
            {errorMessage && (
              <p className="text-algo-red mt-4">{errorMessage}</p>
            )}
          </div>
        </div>
      </li>
    </div>
  );
}
