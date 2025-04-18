import { useWallet } from "@txnlab/use-wallet-react";
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa"; // Importing Font Awesome Times icon
import { UploadJSONButton } from "@/components/UploadJSONButton/UploadJSONButton";
import type { CommitteeCohort } from "@/api";
import { registryClient } from "@/api";
import { cidFromFile, cidStringToUInt8Array } from "@/api";

export function VotingCohort() {
  const [jsonData, setJsonData] = useState<CommitteeCohort | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileCID, setFileCID] = useState<string | null>(null);
  const [committeeDeclared, setCommitteeDeclared] = useState<boolean>(false);

  const [votingCohortNumber, setVotingCohortNumber] = useState<number | null>(
    null,
  );
  const [votingCohortVotePower, setVotingCohortVotePower] = useState<
    number | null
  >(null);

  const { activeAddress, transactionSigner } = useWallet();

  useEffect(() => {
    if (jsonData !== null) {
      console.log("JSON uploaded");

      setVotingCohortNumber(jsonData.members);
      setVotingCohortVotePower(jsonData.votes);
    }
  }, [jsonData]);

  useEffect(() => {
    const calculateCID = async () => {
      if (file) {
        try {
          const cid = await cidFromFile(file);
          setFileCID(cid.toString());
        } catch (error) {
          console.error("Error calculating CID:", error);
          setErrorMessage("Error calculating CID. Please try again.");
        }
      }
    };

    calculateCID();
  }, [file]);

  const handleClearJsonData = () => {
    setJsonData(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFileName(null);
    setFile(null);
    setFileCID(null);
    setVotingCohortNumber(null);
    setVotingCohortVotePower(null);
    setCommitteeDeclared(false);
  };

  const handleDeclareCommitteeCall = async () => {
    if (!activeAddress || !registryClient) {
      return false;
    }

    if (!fileCID || !votingCohortNumber || !votingCohortVotePower) {
      return false;
    }

    try {
      const votingCohortCID = cidStringToUInt8Array(fileCID);
      const res = await registryClient.send.declareCommittee({
        args: [votingCohortCID, votingCohortNumber, votingCohortVotePower],
        sender: activeAddress,
        signer: transactionSigner,
      });

      if (
        res.confirmation.confirmedRound !== undefined &&
        res.confirmation.confirmedRound > 0 &&
        res.confirmation.poolError === ""
      ) {
        console.log("Transaction confirmed");
        setSuccessMessage("Committee declared successfully.");
        setCommitteeDeclared(true);
        return true;
      }

      console.log("Transaction not confirmed");
      setErrorMessage("Transaction not confirmed.\nError declaring committee.");
      return false;
    } catch (error) {
      console.error("Error declaring committee:", error);
      setErrorMessage("Error declaring committee. Please try again.");
      return false;
    }
  };

  return (
    <div>
      <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
        Voting Cohort
      </h1>
      <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
        <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
          Current Voting Cohort Link
        </h1>
        <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
          Previous Voting Cohort Link
        </h1>
        <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
          Previous Voting Cohort Link
        </h1>
        <UploadJSONButton
          setJsonData={setJsonData}
          setErrorMessage={setErrorMessage}
          setFileName={setFileName}
          setFile={setFile}
          disabled={!!jsonData} // Disable button if jsonData is present
        />
        {errorMessage && (
          <div className="text-red-500 mt-2">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="text-green-500 mt-2">{successMessage}</div>
        )}
        {jsonData && fileName && (
          <div className="mt-4 p-2 border rounded bg-green-100 text-green-800 flex items-center justify-between">
            <span>{fileName}</span>
            <button onClick={handleClearJsonData} className="ml-2 text-red-500">
              <FaTimes />
            </button>
          </div>
        )}
        {fileCID && (
          <div className="mt-4">
            <p>
              <strong>CID V1:</strong> {fileCID}
            </p>
          </div>
        )}
        {votingCohortNumber !== null && (
          <div className="mt-4">
            <p>
              <strong>Number of Members:</strong> {votingCohortNumber}
            </p>
          </div>
        )}
        {votingCohortVotePower !== null && (
          <div className="mt-4">
            <p>
              <strong>Total Vote Power:</strong> {votingCohortVotePower}
            </p>
          </div>
        )}
        {fileCID && votingCohortNumber && votingCohortVotePower && (
          <button
            onClick={handleDeclareCommitteeCall}
            disabled={committeeDeclared}
            className={`mt-4 px-4 py-2 rounded w-full ${committeeDeclared ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 text-white"}`}
          >
            {committeeDeclared ? "Committee Declared" : "Declare Committee"}
          </button>
        )}
      </div>
    </div>
  );
}
