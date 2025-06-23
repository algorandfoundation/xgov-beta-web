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

export type ConnectIslandProps = {
  path?: string;
  cta?: string;
  hiddenWhenConnected?: boolean;
  hideIcon?: boolean;
};

export function ConnectController({ path = "/", cta = 'Connect Wallet', hiddenWhenConnected = false, hideIcon = false }: ConnectIslandProps) {
  const manager = useWallet();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (shouldShowTutorial(!!manager.activeAddress)) {
      setShowTutorial(true);
    }
  }, [manager.activeAddress]);

  const handleTutorialClose = () => {
    setShowTutorial(false);
    markTutorialSeen();
  };

  if (hiddenWhenConnected && !!manager.activeWallet) {
    return null;
  }

  return (
    <>
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

      <TutorialDialog
        isOpen={showTutorial}
        onClose={handleTutorialClose}
      />
    </>
  );
}

export function ConnectIsland(props: ConnectIslandProps) {
  console.log('island hiddenWhenConnected:', props.hiddenWhenConnected);
  return (
    <UseWallet>
      <ConnectController {...props} />
    </UseWallet>
  );
}
