import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { getProposalClientById } from "src/algorand/contract-clients";
import { ProposalStatus, ProposalStatusMap } from "@/types/proposals";
import { RegistryAppID } from "src/algorand/contract-clients";
import { ALGORAND_MIN_TX_FEE } from "algosdk";

function ProposalReviewerCard({ proposalId, status, refetch }: { proposalId: bigint, status: ProposalStatus, refetch: () => void }) {
  const { activeAddress, transactionSigner } = useWallet();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleReviewBlock = async (bool: boolean) => {
    const proposalClient = getProposalClientById(proposalId);

    if (!activeAddress || !proposalClient) {
      setErrorMessage("Failed to get proposal client or active address is missing.");
      return false;
    }

    try {
      const res = await proposalClient.send.review({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          block: bool
        },
        appReferences: [RegistryAppID],
         extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos()
      });

      if (res.confirmation.confirmedRound !== undefined && res.confirmation.confirmedRound > 0 && res.confirmation.poolError === '') {
        console.log('Transaction confirmed');
        setErrorMessage(null);
        refetch(); // Update
        return true;
      }

      console.log('Transaction not confirmed');
      setErrorMessage("Transaction not confirmed.");
      return false;
    } catch (error) {
      console.error('Error during review:', error);
      setErrorMessage("An error occurred calling the proposal contract.");
      return false;
    }
  };

  return (
    <div>
      <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
        xGov Reviewer Panel
      </h1>
      <li role="listitem" className="list-none relative bg-algo-blue-20 dark:bg-algo-teal-20 text-algo-black p-4 rounded-lg max-w-xl">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold mt-2 mb-4">Proposal: {proposalId.toString()}</h2>
          <h2 className="text-xl font-bold mt-2 mb-4">Status: {ProposalStatusMap[status]}</h2>
          {status === ProposalStatus.ProposalStatusApproved ? (
            <div>
              <h2 className="text-xl font-bold mt-2 mb-4">Does the proposal conform to the T&Cs?</h2>
              <div className="flex flex-row">
                <button
                  onClick={() => handleReviewBlock(false)}
                  className="mr-2 px-4 py-2 bg-green-500 text-white rounded"
                >
                  OK ✅
                </button>
                <button
                  onClick={() => handleReviewBlock(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Veto ⓧ
                </button>
              </div>
              {errorMessage && (
                <p className="text-red-500 mt-4">{errorMessage}</p>
              )}
            </div>
          ) : (
            <h2 className="text-xl font-bold mt-2 mb-4">No action for you to take.</h2>
          )}
        </div>
      </li>
    </div>
  );
}

export default ProposalReviewerCard;