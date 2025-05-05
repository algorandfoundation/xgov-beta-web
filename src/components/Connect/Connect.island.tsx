import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";

import { Connect } from "@/components/Connect/Connect.tsx";
import { UseWallet } from "@/hooks/useWallet";

export type ConnectIslandProps = {
  path?: string;
};

export function ConnectController({ path = "/" }: ConnectIslandProps) {
  const manager = useWallet();
  return (
    <Connect
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
  return (
    <UseWallet>
      <ConnectController {...props} />
    </UseWallet>
  );
}
