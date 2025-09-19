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

export type ConnectIslandProps = {
  path?: string;
  cta?: string;
  openTutorial?: boolean;
  hideIcon?: boolean;
};

export function ConnectController({ path = "/", cta = 'Connect Wallet', openTutorial = false, hideIcon = false }: ConnectIslandProps) {
  const manager = useWallet();
  const [showTutorial, setShowTutorial] = useState(false);
  const registry = useRegistry();
  const nfd = useNFD(manager.activeAddress)
  const xgov = useXGov(manager.activeAddress);
  const proposer = useProposer(manager.activeAddress);

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
    if (shouldShowTutorial(!!manager.activeAddress)) {
      setShowTutorial(true);
      markTutorialSeen();
    }
  }, [manager.activeAddress]);

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
        ) : (
          <Connect
            cta={cta}
            hideIcon={hideIcon}
            onLogOut={() => {
              manager.activeWallet!.disconnect();
              path.includes("profile") && navigate("/");
            }}
            {...manager}
            path={path}
            nfdName={nfd.data?.name || ""}
          />
        )
      }

      <TutorialDialog
        isOpen={showTutorial}
        onClose={handleTutorialClose}
        currentPage="home"
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
