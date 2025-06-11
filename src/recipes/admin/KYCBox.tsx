import { useState } from "react";
import { FaSync } from "react-icons/fa";
import { decodeAddress } from "algosdk";

import type { ProposerBoxState } from "@/api";
import { registryClient } from "@/api";
import { useAllProposers } from "@/hooks";

import { KYCCard } from "@/components/KYCCard/KYCCard";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { env } from "@/constants";

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

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProposerBoxes.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProposerBoxes.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Filter by address"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={handleRefresh}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center"
        >
          <FaSync />
        </button>
      </div>
      {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
      {currentItems.length === 0 ? (
        <div>No Proposers found.</div>
      ) : (
        currentItems.map((proposerBox) => (
          <KYCCard
            key={proposerBox.parsedAddress}
            proposalAddress={proposerBox.parsedAddress}
            values={proposerBox.values}
            callSetProposerKYC={callSetProposerKYC}
          />
        ))
      )}
      <div className="flex justify-center mt-4">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(index + 1)}
            className={`px-4 py-2 mx-1 border rounded ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-white text-black"}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </>
  );
};
