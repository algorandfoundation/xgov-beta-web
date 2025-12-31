import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";
import { useEffect, useState } from "react";

import { Connect } from "@/components/Connect/Connect";
import { UseWallet } from "@/hooks/useWallet";

import { TutorialDialog } from "@/components/TutorialDialog/TutorialDialog";
import {
  markTutorialSeen,
  shouldShowTutorial
} from "@/stores/firstTimeUserStore";
import { InfinityMirrorButton } from "../button/InfinityMirrorButton/InfinityMirrorButton";
import { WalletIcon } from "../icons/WalletIcon";
import { useNFD, useProposer, UseQuery, useRegistry, useXGov } from "@/hooks";
import { subscribeProposer, subscribeXgov } from "@/api";
import { useTransactionState } from "@/hooks/useTransactionState";
import { cn } from "@/functions/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConnectIslandProps = {
  path?: string;
  cta?: string;
  openTutorial?: boolean;
  hideIcon?: boolean;
};

export function ConnectController({ path = "/", cta = 'Connect Wallet', openTutorial = false, hideIcon = false }: ConnectIslandProps) {
  const manager = useWallet();
  const [showTutorial, setShowTutorial] = useState(false);
  const [shouldOpenTutorialAfterConnect, setShouldOpenTutorialAfterConnect] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const registry = useRegistry();
  const nfd = useNFD(manager.activeAddress)
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
    if (shouldShowTutorial(!!manager.activeAddress)) {
      setShowTutorial(true);
      markTutorialSeen();
    }
  }, [manager.activeAddress]);

  useEffect(() => {
    if (manager.activeAddress && shouldOpenTutorialAfterConnect && openTutorial) {
      setShowTutorial(true);
      setShouldOpenTutorialAfterConnect(false);
    }
  }, [manager.activeAddress, shouldOpenTutorialAfterConnect, openTutorial]);

  const handleTutorialClose = () => {
    setShowTutorial(false);
  };

  return (
    <>
      {
        openTutorial && !!manager.activeWallet ? (
          <InfinityMirrorButton
            className="flex items-center gap-2.5 text-lg rounded-md"
            variant="default"
            onClick={() => {
              setShowTutorial(true);
            }}
          >
            {!hideIcon && <WalletIcon className="size-6 stroke-algo-black group-hover:stroke-white dark:stroke-white dark:group-hover:stroke-algo-black stroke-[1.5]" />}
            {cta}
          </InfinityMirrorButton>
        ) : openTutorial && !manager.activeWallet ? (
          <>
            <InfinityMirrorButton
              className="flex items-center gap-2.5 text-lg rounded-md"
              variant="default"
              onClick={() => {
                setShouldOpenTutorialAfterConnect(true);
                setWalletDialogOpen(true);
              }}
            >
              {!hideIcon && <WalletIcon className="size-6 stroke-algo-black group-hover:stroke-white dark:stroke-white dark:group-hover:stroke-algo-black stroke-[1.5]" />}
              {cta}
            </InfinityMirrorButton>
            
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
        ) : (
          <Connect
            cta={cta}
            hideIcon={hideIcon}
            onLogOut={() => {
              manager.activeWallet!.disconnect();
              path.includes("profile") && navigate("/");
            }}
            path={path}
            nfdName={nfd.data?.name || ""}
          />
        )
      }

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

export function ConnectIsland(props: ConnectIslandProps) {
  return (
    <UseWallet>
      <UseQuery>
        <ConnectController {...props} />
      </UseQuery>
    </UseWallet>
  );
}
