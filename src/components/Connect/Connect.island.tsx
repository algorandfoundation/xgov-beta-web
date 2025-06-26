import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";
import { useEffect, useState } from "react";

import { Connect } from "@/components/Connect/Connect.tsx";
import { UseWallet } from "@/hooks/useWallet";
import { TutorialDialog } from "@/components/TutorialDialog/TutorialDialog";
import {
  markTutorialSeen,
  shouldShowTutorial
} from "@/stores/firstTimeUserStore";
import { InfinityMirrorButton } from "../button/InfinityMirrorButton/InfinityMirrorButton";
import { WalletIcon } from "../icons/WalletIcon";
import { useProposer, UseQuery, useRegistry, useXGov } from "@/hooks";
import { subscribeProposer, subscribeXgov } from "@/api";

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
  const xgov = useXGov(manager.activeAddress);
  const proposer = useProposer(manager.activeAddress);
  const [subscribeXGovLoading, setSubscribeXGovLoading] = useState<boolean>(false);
  const [subscribeProposerLoading, setSubscribeProposerLoading] = useState<boolean>(false);

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
        subscribeXgov={() => subscribeXgov(
          manager.activeAddress,
          manager.transactionSigner,
          setSubscribeXGovLoading,
          registry.data?.xgovFee,
          xgov.refetch
        )}
        subscribeXgovLoading={subscribeXGovLoading}
        isProposer={proposer.data?.isProposer || false}
        proposerSignupCost={registry.data?.proposerFee || 0n}
        subscribeProposer={() => subscribeProposer(
          manager.activeAddress,
          manager.transactionSigner,
          setSubscribeProposerLoading,
          registry.data?.proposerFee!,
          proposer.refetch
        )}
        subscribeProposerLoading={subscribeProposerLoading}
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
