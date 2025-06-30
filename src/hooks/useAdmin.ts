import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { useRegistry } from "@/hooks/useRegistry.ts";

export function useAdmin() {
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const { activeAddress } = useWallet();
  const registryGlobalState = useRegistry();
  useEffect(() => {
    if (!activeAddress) {
      setShowAdmin(false);
      return;
    }

    if (registryGlobalState.isLoading) {
      return;
    }

    const addresses = [
      registryGlobalState.data?.kycProvider,
      registryGlobalState.data?.xgovManager,
      registryGlobalState.data?.xgovDaemon,
      registryGlobalState.data?.committeeManager,
      registryGlobalState.data?.xgovPayor,
      // registryGlobalState.data?.xgovCouncil,
      // registryGlobalState.data?.xgovSubscriber,
    ];

    const isAdmin = addresses.some(
      (address) => address && address === activeAddress,
    );
    setShowAdmin(isAdmin);
  }, [activeAddress, registryGlobalState.isLoading, registryGlobalState.data]);

  return showAdmin;
}
