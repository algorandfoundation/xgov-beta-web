import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";

import { Connect } from "@/components/Connect/Connect.tsx";
import { UseWallet } from "@/hooks/useWallet";
import { useNFD, UseQuery } from "@/hooks";

export type ConnectIslandProps = {
  path?: string;
};

export function ConnectController({ path = "/" }: ConnectIslandProps) {
  const manager = useWallet();
  const nfd = useNFD(manager.activeAddress)

  return (
    <Connect
      onLogOut={() => {
        manager.activeWallet!.disconnect();
        path.includes("profile") && navigate("/");
      }}
      {...manager}
      path={path}
      nfdName={nfd.data?.properties?.internal?.name || ""}
    />
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
