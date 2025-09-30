import { useState } from "react";
import { TutorialDialog } from "@/components/TutorialDialog/TutorialDialog";
import { UseWallet, UseQuery, useNFD, useProposer, useRegistry, useXGov } from "@/hooks";
import { subscribeProposer, subscribeXgov } from "@/api";
import { useTransactionState } from "@/hooks/useTransactionState";
import { useWallet } from "@txnlab/use-wallet-react";
import { cn } from "@/functions/utils";

interface GetStartedNavProps {
  path?: string;
}

export function GetStartedNav({ path = "/" }: GetStartedNavProps) {
  const manager = useWallet();
  const [showTutorial, setShowTutorial] = useState(false);
  const registry = useRegistry();
  const nfd = useNFD(manager.activeAddress)
  const xgov = useXGov(manager.activeAddress);
  const proposer = useProposer(manager.activeAddress);

  // Determine current page based on path
  const getCurrentPage = (pathname: string): 'home' | 'profile' | 'proposals' | 'other' => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/proposal')) return 'proposals';
    return 'other';
  };

  const {
    status: subXGovStatus,
    setStatus: setSubXGovStatus,
    errorMessage: subXGovErrorMessage,
    setErrorMessage: setSubXGovErrorMessage,
    isPending: isSubXGovPending
  } = useTransactionState()

  const {
    status: subProposerStatus,
    setStatus: setSubProposerStatus,
    errorMessage: subProposerErrorMessage,
    setErrorMessage: setSubProposerErrorMessage,
    isPending: isSubProposerPending
  } = useTransactionState()

  const handleGetStartedClick = () => {
    console.log('GetStartedNav: currentPage =', getCurrentPage(path), 'path =', path);
    setShowTutorial(true);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
  };

  return (
    <>
      <button
        data-testid="header-get-started-link"
        className={cn(
          "px-2 py-1 hover:bg-white/10 dark:hover:bg-algo-black/10 rounded-md font-bold text-lg",
        )}
        onClick={handleGetStartedClick}
      >
        Get Started
      </button>

      <TutorialDialog
        isOpen={showTutorial}
        onClose={handleTutorialClose}
        currentPage={getCurrentPage(path)}
        activeAddress={manager.activeAddress}
        isXGov={xgov.data?.isXGov || false}
        xGovSignupCost={registry.data?.xgovFee || 0n}
        subscribeXgov={() => subscribeXgov({
          activeAddress: manager.activeAddress,
          innerSigner: manager.transactionSigner,
          setStatus: setSubXGovStatus,
          refetch: [xgov.refetch],
          xgovFee: registry.data?.xgovFee,
        })}
        subscribeXgovTxnState={{
          status: subXGovStatus,
          errorMessage: subXGovErrorMessage,
          isPending: isSubXGovPending,
        }}
        isProposer={proposer.data?.isProposer || false}
        proposerSignupCost={registry.data?.proposerFee || 0n}
        subscribeProposer={() => subscribeProposer({
          activeAddress: manager.activeAddress,
          innerSigner: manager.transactionSigner,
          setStatus: setSubProposerStatus,
          refetch: [proposer.refetch],
          amount: registry.data?.proposerFee!,
        })}
        subscribeProposerTxnState={{
          status: subProposerStatus,
          errorMessage: subProposerErrorMessage,
          isPending: isSubProposerPending,
        }}
      />
    </>
  );
}

export function GetStartedNavIsland(props: GetStartedNavProps) {
  return (
    <UseWallet>
      <UseQuery>
        <GetStartedNav {...props} />
      </UseQuery>
    </UseWallet>
  );
}
