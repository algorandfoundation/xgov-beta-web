import { BarsIcon } from "@/components/icons/BarsIcon";
import { MoonIcon } from "@/components/icons/MoonIcon";
import { SunIcon } from "@/components/icons/SunIcon";
import { WalletIcon } from "@/components/icons/WalletIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@nanostores/react";
import { $themeStore, toggleTheme } from "@/stores/themeStore";
import { useWallet } from "@txnlab/use-wallet-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "../Link";
import { UseWallet, UseQuery, useNFD, useProposer, useRegistry, useXGov } from "@/hooks";
import { TutorialDialog } from "@/components/TutorialDialog/TutorialDialog";
import { subscribeProposer, subscribeXgov } from "@/api";
import { useTransactionState } from "@/hooks/useTransactionState";

export function MobileNavIsland(props: { trigger?: ReactNode; path?: string }) {
  return (
    <UseWallet>
      <UseQuery>
        <MobileNav {...props} />
      </UseQuery>
    </UseWallet>
  );
}

export function MobileNav({ trigger, path = "/" }: { trigger?: ReactNode; path?: string }) {
  const manager = useWallet();
  const { wallets, activeAddress, activeWallet } = manager;
  const theme = useStore($themeStore);
  const registry = useRegistry();
  const xgov = useXGov(activeAddress);
  const proposer = useProposer(activeAddress);

  const getCurrentPage = (pathname: string): 'home' | 'profile' | 'proposals' | 'other' => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/proposal')) return 'proposals';
    return 'other';
  };

  const [open, setOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

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

  useEffect(() => {
    if (!open) {
      setConnectDialogOpen(false);
    }
  }, [open]);

  const handleGetStartedClick = () => {
    setShowTutorial(true);
    setOpen(false);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
  };

  return (
    <>
      <Dialog open={open}>
        <DialogTrigger asChild>
          {!trigger ? (
            <Button
              className="lg:hidden border-none shadow-none bg-transparent hover:text-white hover:bg-transparent dark:hover:text-algo-black"
              variant="outline"
              size="icon"
              onClick={() => setOpen(true)}
            >
              <BarsIcon className="size-10 text-white/70 dark:text-algo-black-70" />
            </Button>
          ) : (
            trigger
          )}
        </DialogTrigger>
        <DialogContent className="h-full" onCloseClick={() => setOpen(false)}>
          <DialogTitle className="sr-only">Navigate</DialogTitle>

        {!connectDialogOpen ? (
          <nav className="h-full flex flex-col items-start justify-center gap-14">
            <Link
              className="px-4 text-5xl font-bold text-algo-black dark:text-white focus:outline-none underline-offset-4 hover:underline focus-visible:ring-0 dark:focus-visible:ring-0 focus-visible:underline"
              to="/"
            >
              Home
            </Link>

            <Button
              className="px-4 text-5xl font-bold text-algo-black dark:text-white focus:outline-none underline-offset-4 hover:underline focus-visible:ring-0 dark:focus-visible:ring-0 focus-visible:underline"
              variant="link"
              onClick={handleGetStartedClick}
            >
              Get Started
            </Button>

            <Link
              className="px-4 text-5xl font-bold text-algo-black dark:text-white focus:outline-none underline-offset-4 hover:underline focus-visible:ring-0 dark:focus-visible:ring-0 focus-visible:underline"
              to="https://forum.algorand.co/c/gov-guides/32"
            >
              Docs
            </Link>

            {
              !!activeAddress && (
                <Link
                  className="px-4 text-5xl font-bold text-algo-black dark:text-white focus:outline-none"
                  to={`/profile/${activeAddress}`}
                >
                  Profile
                </Link>
              )
            }

            <Button
              className="text-5xl font-bold gap-4 ring-0 ring-transparent focus:outline-none"
              variant="link"
              onClick={() => {
                if (!!activeAddress) {
                  activeWallet?.disconnect();
                } else {
                  setConnectDialogOpen(true);
                }
              }}
            >
              {!!activeAddress ? (
                "Disconnect"
              ) : (
                <>
                  <WalletIcon className="stroke-algo-black dark:stroke-white size-12" />
                  Connect
                </>
              )}
            </Button>

            <Button
              className="text-5xl font-bold gap-4 focus:outline-none"
              variant="link"
              onClick={() => toggleTheme()}
            >
              {theme === "light" ? (
                <SunIcon className="stroke-algo-black dark:stroke-white size-12" />
              ) : (
                <MoonIcon className="stroke-algo-black dark:stroke-white size-12" />
              )}
              Theme
            </Button>
          </nav>
        ) : (
          <ul className="h-full flex flex-col items-start justify-center gap-14">
            {wallets.map((wallet) => (
              <li key={wallet.id}>
                <Button
                  className="text-5xl font-bold flex gap-4 focus:outline-none"
                  variant="link"
                  onClick={() => {
                    wallet.connect();
                    setOpen(false);
                  }}
                >
                  <div className="bg-algo-black overflow-hidden rounded-2xl">
                    <div className="p-0.5">
                      <div className="size-14 overflow-hidden rounded-2xl">
                        <img
                          className="object-cover"
                          src={wallet.metadata.icon}
                          alt={`${wallet.metadata.name} icon`}
                        />
                      </div>
                    </div>
                  </div>
                  {wallet.metadata.name}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
    
    <TutorialDialog
      isOpen={showTutorial}
      onClose={handleTutorialClose}
      currentPage={getCurrentPage(path)}
      activeAddress={activeAddress}
      isXGov={xgov.data?.isXGov || false}
      xGovSignupCost={registry.data?.xgovFee || 0n}
      subscribeXgov={() => subscribeXgov({
        activeAddress: activeAddress,
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
        activeAddress: activeAddress,
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
