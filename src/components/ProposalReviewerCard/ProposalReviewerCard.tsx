import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  RegistryAppID,
  getProposalClientById,
  type ProposalMainCardDetails,
  ProposalStatus,
} from "@/api";
import { ALGORAND_MIN_TX_FEE } from "algosdk";
import { UseWallet } from "@/hooks/useWallet.tsx";
import { useProposal, UseQuery } from "@/hooks";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";

export function ReviewerCardIsland({
  proposal,
}: {
  proposal: ProposalMainCardDetails;
}) {
  return (
    <UseQuery>
      <UseWallet>
        <ProposalReviewerCard proposalId={proposal.id} status={proposal.status} />
      </UseWallet>
    </UseQuery>
  );
}
export function ProposalReviewerCard({
  proposalId,
  status,
}: {
  proposalId: bigint;
  status: ProposalStatus;
}) {
  const { activeAddress, transactionSigner } = useWallet();
  const proposalQuery = useProposal(proposalId);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReviewBlock = async (bool: boolean) => {
    const proposalClient = getProposalClientById(proposalId);

    if (!activeAddress || !proposalClient) {
      setErrorMessage(
        "Failed to get proposal client or active address is missing.",
      );
      return false;
    }

    try {
      const res = await proposalClient.send.review({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          block: bool,
        },
        appReferences: [RegistryAppID],
        extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
      });

      if (
        res.confirmation.confirmedRound !== undefined &&
        res.confirmation.confirmedRound > 0 &&
        res.confirmation.poolError === ""
      ) {
        console.log("Transaction confirmed");
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

  return (
    <div>
      <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
        xGov Reviewer Panel
      </h1>
      <li
        role="listitem"
        className="list-none relative bg-algo-blue-20 dark:bg-algo-teal-20 text-algo-black p-4 rounded-lg max-w-xl"
      >
        <div className="max-w-3xl">
          {status === ProposalStatus.ProposalStatusApproved ? (
            <div>
              <h2 className="text-xl mt-2 mb-4">
                Does the proposal conform to the Terms & Conditions?
              </h2>
              <div className="flex flex-row gap-2">
                <Button
                  onClick={() => handleReviewBlock(true)}
                  variant='destructive'
                >
                  <XIcon className="text-white group-hover:text-red-500 transition"/>
                  Block
                </Button>
                <Button
                  onClick={() => handleReviewBlock(false)}
                  variant='success'
                >
                  <CheckIcon className="text-white group-hover:text-algo-green transition" />
                  Approve
                </Button>
              </div>
              {errorMessage && (
                <p className="text-red-500 mt-4">{errorMessage}</p>
              )}
            </div>
          ) : (
            <h2 className="text-xl font-bold mt-2 mb-2">
              No action for you to take.
            </h2>
          )}
        </div>
      </li>
    </div>
  );
}
