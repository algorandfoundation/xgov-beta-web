import { useWallet } from "@txnlab/use-wallet-react";

import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner.tsx";
import { ConnectIsland } from "@/components/Connect/Connect.island.tsx";

import { UseQuery } from "@/hooks/useQuery.tsx";
import { UseWallet } from "@/hooks/useWallet.tsx";
import { useProposer, useRegistry } from "@/hooks/useRegistry.ts";
import { subscribeProposer } from "@/api";
import { useTransactionState } from "@/hooks/useTransactionState";

/**
 * SignupIsland is a function component that sets up the signup process within the application.
 * It uses the UseQuery and UseWallet context providers to manage dependencies
 * and the SignupController to handle the signup flow.
 *
 */
export function SignupIsland() {
  return (
    <UseQuery>
      <UseWallet>
        <SignupController />
      </UseWallet>
    </UseQuery>
  );
}

/**
 * Handles the signup process for a proposer.
 * This controller manages the state of the signup process,
 * including error handling, loading state, and user interactions.
 *
 * The function checks if the user is connected to an Algorand wallet and retrieves proposer information.
 * Depending on the state, it renders appropriate UI components such as error messages,
 * a loading spinner, or the Signup component.
 */
export function SignupController() {
  const { activeAddress, transactionSigner } = useWallet();
  const registry = useRegistry();
  const proposer = useProposer(activeAddress);

  const {
    status,
    setStatus,
    errorMessage,
  } = useTransactionState()

  const isError = registry.isError || proposer.isError;
  const qError = registry.error || proposer.error;
  const isLoading = registry.isLoading || proposer.isLoading;

  if (status instanceof Error || isError) {
    return <p>{isError ? qError!.message : errorMessage}</p>;
  }

  if (isLoading || !registry.data || !registry.data.proposerFee) {
    return <LoadingSpinner />;
  }

  if (!activeAddress) {
    return (
      <>
        <p>Connect to Algorand Wallet</p>
        <ConnectIsland path={"/"} />
      </>
    );
  }

  return (
    <Signup
      isRegistered={proposer.data?.isProposer || false}
      onSignup={() =>
        subscribeProposer({
          activeAddress,
          innerSigner: transactionSigner,
          setStatus,
          refetch: [proposer.refetch],
          amount: registry?.data?.proposerFee!,
        })
      }
    />
  );
}

/**
 * Represents the properties required for a signup component.
 */
export type SignupProps = {
  /**
   * A boolean variable indicating whether a user, system, or entity is registered.
   * If `true`, the entity is registered; if `false`, it is unregistered.
   */
  isRegistered: boolean;
  /**
   * A callback function that is triggered when a signup request occurs.
   * The function does not accept any parameters and does not return a value.
   */
  onSignup: () => void;
};

/**
 * Displays a button that allows the user to send a signup transaction
 * or shows a disabled button if the process is already completed.
 * Includes additional information and guidance about KYC requirements for eligibility.
 */
export function Signup({ isRegistered, onSignup }: SignupProps) {
  return (
    <div className="relative mx-auto  border-2 border-algo-black dark:border-white  p-4 rounded-lg max-w-3xl">
      <p className="mb-4">
        Press the button below to send an on-chain proposer subscription
        submission.
      </p>
      {isRegistered ? (
        <button
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded w-full cursor-not-allowed"
          disabled
        >
          Already Sent On-chain Subscription
        </button>
      ) : (
        <button
          onClick={onSignup}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded w-full"
        >
          Send On-Chain Proposer Subscription
        </button>
      )}
      <div className="mt-6">
        <p className="mb-4">
          To become an <i>accepted</i> proposer, however, you must first be
          KYC:ed. Follow the KYC link below and the instructions there. The
          Algorand Foundation has partnered with them to conduct KYC on our
          behalf.
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
  );
}
