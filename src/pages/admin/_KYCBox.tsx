import { decodeAddress } from "algosdk";
import { KYCCard } from "@/components/KYCCard/KYCCard";
import { useState } from "react";
import type { ProposerBoxState } from 'src/types/proposer';
import { RegistryClient as registryClient } from "src/algorand/contract-clients";
import { useAllProposers } from "src/hooks/useRegistry";
import { FaSync } from 'react-icons/fa';

export interface KYCData {
  address: string;
  kycStatus: boolean;
  expiration: Date | null;
}

export interface ProposerBoxes {
  parsedAddress: string;
  values: ProposerBoxState;
}

export const KYCBox = ({ kycProvider, activeAddress, transactionSigner }: { kycProvider: string, activeAddress: string, transactionSigner: any }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filter, setFilter] = useState("");

  const allProposers = useAllProposers();

  const proposerBoxes = allProposers.data
    ? Object.keys(allProposers.data).map(key => ({
        parsedAddress: key,
        values: allProposers.data[key] as unknown as ProposerBoxState,
      }))
    : [];

  async function callSetProposerKYC(proposalAddress: string, kycStatus: boolean, expiration: number) {
    console.log('Setting KYC status of', proposalAddress, 'to', kycStatus, 'with expiration date', expiration);

    if (!activeAddress || !registryClient) {
      setErrorMessage("Active address or registry client not available.");
      return false;
    }

    const addr = decodeAddress(activeAddress).publicKey;
    const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));

    try {
      const res = await registryClient.send.setProposerKyc({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          proposer: proposalAddress,
          kycStatus: kycStatus,
          kycExpiring: expiration,
        },
        boxReferences: [proposerBoxName],
      });

      if (res.confirmation.confirmedRound !== undefined && res.confirmation.confirmedRound > 0 && res.confirmation.poolError === '') {
        console.log('Transaction confirmed');
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
    return <div>Loading...</div>;
  }

  // Filter proposerBoxes based on the filter criteria
  const filteredProposerBoxes = proposerBoxes.filter((box) =>
    box.parsedAddress.toLowerCase().includes(filter.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProposerBoxes.slice(indexOfFirstItem, indexOfLastItem);
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
      {errorMessage && (
        <div className="text-red-500 mb-4">{errorMessage}</div>
      )}
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
            className={`px-4 py-2 mx-1 border rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </>
  );
};