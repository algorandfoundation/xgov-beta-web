import { ABIType, decodeAddress, encodeAddress } from "algosdk";
import { KYCCard } from "@/components/KYCCard/KYCCard";
import { useRegistryClient } from "@/contexts/RegistryClientContext";
import { Algorand } from "src/algorand/algo-client";
import { useState, useEffect } from "react";
import type { ProposerBoxData } from '@/contexts/RegistryClientContext';

export interface KYCData {
  address: string;
  kycStatus: boolean;
  expiration: Date | null;
}

export interface ProposerBoxes {
  parsedAddress: string;
  values: ProposerBoxData;
}

export const KYCBox = ({ kycProvider, activeAddress, transactionSigner }: { kycProvider: string, activeAddress: string, transactionSigner: any }) => {
  const { registryClient, boxes, boxesLoading, refreshBoxes } = useRegistryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [proposerBoxes, setProposerBoxes] = useState<ProposerBoxes[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (registryClient && !boxesLoading) {
      const fetchProposers = async () => {
        try {
          const resolvedBoxes = await boxes;
          const requests = await Promise.all(resolvedBoxes
            .filter((box: any) => box.name.nameRaw[0] === 'p'.charCodeAt(0)) // Proposer box specifically
            .map(async (box: any) => ({
              parsedAddress: encodeAddress(box.name.nameRaw.slice(1)),
              values: await Algorand.app.getBoxValueFromABIType({
                appId: BigInt(registryClient.appId),
                boxName: box.name.nameRaw,
                type: ABIType.from('(bool,bool,uint64)')
              }) as ProposerBoxData
            })));
          setProposerBoxes(await Promise.all(requests));
        } catch (error) {
          console.error("Failed to fetch boxes", error);
          setErrorMessage("Failed to fetch boxes.");
        }
      };
      fetchProposers();
    }
  }, [registryClient, boxesLoading, refreshTrigger, boxes]);

  async function callSetProposerKYC(proposalAddress: string, kycStatus: boolean, expiration: number) {
    console.log('Setting KYC status of', proposalAddress, 'to', kycStatus, 'with expiration date', expiration);

    if (!activeAddress || !registryClient) {
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
        setRefreshTrigger(prev => !prev); // Trigger the useEffect to refresh boxes and fetch proposers
        refreshBoxes(); // Explicitly refresh boxes
        return true;
      }

      console.log("Transaction failed to confirm:", res);
      return false;
    } catch (error) {
      console.error("Failed to set KYC status", error);
      return false;
    }
  }

  if (kycProvider === undefined || kycProvider !== activeAddress) {
    return <div>You are not set as the KYC provider</div>;
  }

  if (boxesLoading) {
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

  return (
    <>
      <input
        type="text"
        placeholder="Filter by address"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 p-2 border rounded"
      />
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