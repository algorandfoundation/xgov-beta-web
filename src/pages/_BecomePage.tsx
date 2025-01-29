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
import { useWallet } from "@txnlab/use-wallet-react";
import { decodeAddress } from "algosdk";
import { useState, type ComponentType } from "react";
import { AlgorandClient as algorand } from "src/algorand/algo-client";
import { useProposer } from "src/hooks/useRegistry";
import { RegistryClient as registryClient } from "src/algorand/contract-clients";

const title = 'xGov';

export function BecomeProposerPage() {
  const { activeAddress, transactionSigner } = useWallet();
  const [errorMessage, setErrorMessage] = useState("");

  const proposerCall = useProposer(activeAddress);
  const { data, isLoading } = proposerCall;

  async function callSubscribeProposer() {
    if (!activeAddress) {
      setErrorMessage("Active address not available.");
      return false;
    }

    try {
      // TODO: remove the boxSeedingPayment and have the payment in the subscribeProposer call
      // cover the box seeding fee.
      await algorand.send.payment({
        sender: activeAddress,
        signer: transactionSigner,
        receiver: registryClient.appAddress,
        amount: (119300).microAlgo(),
      });
      
      // TODO: instead of 0 Algo, have the amount set by self.proposer_fee.value
      const payment = await algorand.createTransaction.payment({
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
        // Refresh proposer status
        proposerCall.refetch();
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

        {isLoading && (<div>Loading...</div>)}
        {!isLoading && (
          <>
            {errorMessage && (
              <div className="text-red-500 mb-4">{errorMessage}</div>
            )}
    
            {!activeAddress ? (
              <div>Wallet not connected.</div>
            ) : (
              <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
                <p className="mb-4">
                  Press the button below to send an on-chain proposer subscription submission.
                </p>
                {data?.isProposer ? (
                <button
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded w-full cursor-not-allowed"
                  disabled
                >
                  Already Sent On-chain Subscription
                </button>
                ) : (
                  <button
                    onClick={callSubscribeProposer}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded w-full"
                  >
                    Send On-Chain Proposer Subscription
                  </button>
                )}
                <div className="mt-6">
                  <p className="mb-4">
                    To become an <i>accepted</i> proposer, however, you must first be KYC:ed. Follow the KYC link below and the instructions there. The Algorand Foundation has partnered with them to conduct KYC on our behalf.
                  </p>
                  <a
                    href="https://algorand-foundation.synaps.me/networks/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-4 text-blue-500 underline"
                  >
                    KYC Signup
                  </a>
                </div>
              </div>
            )}
          </>
        )}
        
      </div>
    </Page>
  );
}