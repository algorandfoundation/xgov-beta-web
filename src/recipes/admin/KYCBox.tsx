import { useState } from "react";
import { RefreshCcwIcon } from "lucide-react";
import { decodeAddress } from "algosdk";

import type { ProposerBoxState } from "@/api";
import { registryClient } from "@/api";
import { env } from "@/constants";
import { useAllProposers } from "@/hooks";

import { KYCCard } from "@/components/KYCCard/KYCCard";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { Button } from "@/components/ui/button";

export interface KYCData {
  address: string;
  kycStatus: boolean;
  expiration: Date | null;
}

export interface ProposerBoxes {
  parsedAddress: string;
  values: ProposerBoxState;
}

const network = env.PUBLIC_NETWORK;

export const KYCBox = ({
  kycProvider,
  activeAddress,
  transactionSigner,
}: {
  kycProvider: string;
  activeAddress: string;
  transactionSigner: any;
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filter, setFilter] = useState("");

  const allProposers = useAllProposers();

  const proposerBoxes = allProposers.data
    ? Object.keys(allProposers.data).map((key) => ({
      parsedAddress: key,
      values: allProposers.data[key] as unknown as ProposerBoxState,
    }))
    : [];

  async function callSetProposerKYC(
    proposalAddress: string,
    kycStatus: boolean,
    expiration: number,
  ) {
    console.log(
      "Setting KYC status of",
      proposalAddress,
      "to",
      kycStatus,
      "with expiration date",
      expiration,
    );

    if (!activeAddress || !registryClient) {
      setErrorMessage("Active address or registry client not available.");
      return false;
    }

    const addr = decodeAddress(proposalAddress).publicKey;
    const proposerBoxName = new Uint8Array(
      Buffer.concat([Buffer.from("p"), addr]),
    );

    try {
      const shouldFund = network === "testnet" && kycStatus === true;

      let builder = registryClient.newGroup().setProposerKyc({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          proposer: proposalAddress,
          kycStatus: kycStatus,
          kycExpiring: expiration,
        },
        boxReferences: [proposerBoxName],
      });

      if (shouldFund) {
        builder = builder.addTransaction(
          await registryClient.algorand.createTransaction.payment({
            sender: activeAddress,
            receiver: proposalAddress,
            amount: (200).algos(),
          }),
        );
      }

      const res = await builder.send()

      const { confirmations: [confirmation] } = res

      if (
        confirmation.confirmedRound !== undefined &&
        confirmation.confirmedRound > 0 &&
        confirmation.poolError === ""
      ) {
        console.log("Transaction confirmed");
        allProposers.refetch();
        setErrorMessage(""); // Clear any previous error message
        return true;
      }

      console.log("Transaction failed to confirm:", res);
      setErrorMessage("Transaction failed to confirm.");
      return false;
    } catch (error) {
      console.error("Failed to set KYC status", error);
      setErrorMessage("Failed to set KYC status. Please try again.");
      return false;
    }
  }

  if (kycProvider === undefined || kycProvider !== activeAddress) {
    return <div>You are not set as the KYC provider</div>;
  }

  if (allProposers.isLoading) {
    return <LoadingSpinner />;
  }

  // Filter proposerBoxes based on the filter criteria
  const filteredProposerBoxes = proposerBoxes.filter((box) =>
    box.parsedAddress.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleRefresh = () => {
    try {
      allProposers.refetch();
      setErrorMessage(""); // Clear any previous error message
    } catch (error) {
      console.error("Failed to refresh proposers", error);
      setErrorMessage("Failed to refresh proposers. Please try again.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-wrap text-algo-black dark:text-white m-0">
          KYC
        </h2>

        <div className="inline-flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by address"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-1 px-2 border rounded-md lg:min-w-96 dark:bg-algo-black-80 dark:border-algo-black-80"
          />
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="xs"
            className="p-4 h-6 dark:bg-algo-black-80"
          >
            <RefreshCcwIcon className="size-3" />
          </Button>
        </div>
      </div>
      {errorMessage && <div className="text-algo-red mb-4">{errorMessage}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProposerBoxes.length === 0 ? (
          <div>No Proposers found.</div>
        ) : (
          filteredProposerBoxes.map((proposerBox) => (
            <KYCCard
              key={proposerBox.parsedAddress}
              proposalAddress={proposerBox.parsedAddress}
              values={proposerBox.values}
              callSetProposerKYC={callSetProposerKYC}
            />
          ))
        )}
      </div>
    </>
  );
};
