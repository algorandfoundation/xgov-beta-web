import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";

import { Connect } from "@/components/Connect/Connect.tsx";
import { UseWallet } from "@/hooks/useWallet";

export type ConnectIslandProps = {
  path?: string;
  cta?: string;
  hiddenWhenConnected?: boolean;
};

export function ConnectController({ path = "/", cta = 'Connect Wallet', hiddenWhenConnected = false }: ConnectIslandProps) {
  const manager = useWallet();

  console.log('hiddenWhenConnected:', hiddenWhenConnected);
  
  if (hiddenWhenConnected && !!manager.activeWallet) {
    return null;
  }

  return (
    <Connect
      cta={cta}
      onLogOut={() => {
        manager.activeWallet!.disconnect();
        path.includes("profile") && navigate("/");
      }}
      {...manager}
      path={path}
    />
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
