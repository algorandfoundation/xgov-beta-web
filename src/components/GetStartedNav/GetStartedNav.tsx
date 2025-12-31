import { useState, useEffect } from "react";
import { TutorialDialog } from "@/components/TutorialDialog/TutorialDialog";
import { UseWallet, UseQuery, useProposer, useRegistry, useXGov } from "@/hooks";
import { subscribeProposer, subscribeXgov } from "@/api";
import { useTransactionState } from "@/hooks/useTransactionState";
import { useWallet } from "@txnlab/use-wallet-react";
import { cn } from "@/functions/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GetStartedNavProps {
  path?: string;
}

export function GetStartedNav({ path = "/" }: GetStartedNavProps) {
  const manager = useWallet();
  const [showTutorial, setShowTutorial] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [shouldOpenTutorialAfterConnect, setShouldOpenTutorialAfterConnect] = useState(false);
  const registry = useRegistry();
  const xgov = useXGov(manager.activeAddress);
  const proposer = useProposer(manager.activeAddress);

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
    isPending: isSubXGovPending
  } = useTransactionState()

  const {
    status: subProposerStatus,
    setStatus: setSubProposerStatus,
    errorMessage: subProposerErrorMessage,
    isPending: isSubProposerPending
  } = useTransactionState()

  useEffect(() => {
    if (manager.activeAddress && shouldOpenTutorialAfterConnect) {
      setShowTutorial(true);
      setShouldOpenTutorialAfterConnect(false);
    }
  }, [manager.activeAddress, shouldOpenTutorialAfterConnect]);

  const handleGetStartedClick = () => {
    if (manager.activeAddress) {
      setShowTutorial(true);
    } else {
      setShouldOpenTutorialAfterConnect(true);
      setWalletDialogOpen(true);
    }
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

      <Dialog open={walletDialogOpen}>
        <DialogContent
          className="h-full sm:h-auto sm:max-w-[425px] rounded-lg"
          onCloseClick={() => setWalletDialogOpen(false)}
        >
          <DialogHeader className="mt-12 flex flex-col items-start gap-2">
            <DialogTitle className="dark:text-white">
              Connect your wallet
            </DialogTitle>
            <DialogDescription>
              Choose a wallet to connect & use the xGov app
            </DialogDescription>
          </DialogHeader>
          <ul className="h-full flex flex-col sm:flex-row sm:flex-wrap items-start justify-center sm:justify-start gap-8 sm:gap-3 mt-6">
            {manager.wallets.map((wallet) => (
              <li key={wallet.id}>
                <button
                  className="group text-5xl sm:text-xl font-bold flex items-center gap-4 h-18 pr-5 pl-1 py-1 sm:py-0.5 sm:bg-algo-blue/10 hover:bg-algo-blue dark:sm:bg-algo-teal/10 dark:hover:bg-algo-teal dark:text-white hover:text-white dark:hover:text-algo-black rounded-2xl transition"
                  onClick={() => {
                    setWalletDialogOpen(false);
                    wallet.connect();
                  }}
                >
                  <div
                    className={cn(
                      ["exodus", "lute"].includes(
                        wallet.metadata.name.toLowerCase(),
                      )
                        ? "bg-algo-black p-0.5"
                        : "",
                      "size-14 sm:size-6 overflow-hidden rounded-2xl group-hover:shadow-xl",
                    )}
                  >
                    <img
                      className="object-cover"
                      src={wallet.metadata.icon}
                      alt={`${wallet.metadata.name} icon`}
                    />
                  </div>

                  {wallet.metadata.name}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
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
