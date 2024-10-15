import { Link, type LinkProps } from "@/components/Link";
import { Page } from "@/components/Page";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useRegistryClient } from "@/contexts/RegistryClientContext";
import { useWallet } from "@txnlab/use-wallet-react";
import { decodeAddress } from "algosdk";
import { useEffect, useState, type ComponentType } from "react";
import { Algorand } from "src/algorand/algo-client";

const title = 'xGov';

export function BecomeProposerPage() {
  const { registryClient, boxes, refreshBoxes } = useRegistryClient();
  const { activeAddress, transactionSigner } = useWallet();
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedAlready, setSubmittedAlready] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubmissionStatus = () => {
      if (boxes && activeAddress) {
        const addr = decodeAddress(activeAddress).publicKey;
        const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));
        setSubmittedAlready(boxes.some((box) => box.name.nameRaw.every((byte, index) => byte === proposerBoxName[index])));
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    checkSubmissionStatus();
  }, [boxes, activeAddress]);

  async function callSubscribeProposer() {
    if (!activeAddress || !registryClient) {
      setErrorMessage("Active address or registry client not available.");
      return false;
    }

    try {
      // TODO: remove the boxSeedingPayment and have the payment in the subscribeProposer call
      // cover the box seeding fee.
      const boxSeedingPayment = await Algorand.send.payment({
        sender: activeAddress,
        signer: transactionSigner,
        receiver: registryClient.appAddress,
        amount: (119300).microAlgo(),
      });
      
      // TODO: instead of 0 Algo, have the amount set by self.proposer_fee.value
      const payment = await Algorand.createTransaction.payment({
        sender: activeAddress,
        signer: transactionSigner,
        receiver: registryClient.appAddress,
        amount: (0).algo(),
      });

      const addr = decodeAddress(activeAddress).publicKey;
      const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));

      const res = await registryClient.send.subscribeProposer({
        sender: activeAddress,
        signer: transactionSigner,
        args: { payment: payment },
        boxReferences: [proposerBoxName],
      });

      if (res.confirmation.confirmedRound !== undefined && res.confirmation.confirmedRound > 0 && res.confirmation.poolError === '') {
        console.log('Subscription confirmed');
        await refreshBoxes();
        // Re-check the submission status after refreshing the boxes
        const updatedBoxes = await registryClient.appClient.getBoxValues();
        const addr = decodeAddress(activeAddress).publicKey;
        const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));
        setSubmittedAlready(updatedBoxes.some((box) => box.name.nameRaw.every((byte, index) => byte === proposerBoxName[index])));
        return true;
      }

      console.log("Subscription failed to confirm:", res);
      setErrorMessage("Subscription failed to confirm.");
      return false;
    } catch (error) {
      console.error("Failed to subscribe proposer", error);
      setErrorMessage("Failed to subscribe proposer.");
      return false;
    }
  }

  return (
    <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
      <div>
        <Breadcrumb className="-mb-[20px]">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Become Proposer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
          Become A Proposer
        </h1>

        {loading && (<div>Loading...</div>)}
        {!loading && (
          <>
            {errorMessage && (
              <div className="text-red-500 mb-4">{errorMessage}</div>
            )}
    
            {!activeAddress ? (
              <div>Wallet not connected.</div>
            ) : (
              <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
                <p className="mb-4">
                  To become a proposer you need to be KYC:ed. Follow the KYC link and the instructions there. The Algorand Foundation has partnered with them to conduct KYC on our behalf.
                </p>
                <a
                  href="https://algorand-foundation.synaps.me/networks/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 text-blue-500 underline"
                >
                  KYC Signup
                </a>
                {submittedAlready ? (
                  <p className="mb-4">
                    You have already sent your submission on-chain.
                  </p>
                ) : (
                  <button
                    onClick={callSubscribeProposer}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded w-full"
                  >
                    Send Proposer Subscription
                  </button>
                )}
              </div>
            )}
          </>
        )}
        
      </div>
    </Page>
  );
}