import { useState } from "react";

import { useWallet } from "@txnlab/use-wallet-react";

import { KYCBox } from "./KYCBox";
import { RoleList, RoleModal } from "./RolesSection";
import { PanelStatistics } from "./PanelStatistics";

import { registryClient } from "@/api";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { UseQuery, UseWallet, useRegistry } from "@/hooks";
export function AdminPageIsland() {
  return (
    <UseQuery>
      <UseWallet>
        <AdminPage />
      </UseWallet>
    </UseQuery>
  );
}
export function AdminPage() {
  const { activeAddress, transactionSigner, activeNetwork } = useWallet();
  const registryGlobalState = useRegistry();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const handleSetRole = (role: string) => {
    setSelectedRole(role);
    setModalIsOpen(true);
  };

  const handleSubmitAddress = async (address: string) => {
    console.log(`Setting ${selectedRole} to ${address}`);

    if (!activeAddress || !registryClient) {
      return false;
    }

    let res;

    switch (selectedRole) {
      case "xGovManager":
        res = await registryClient.send.setXgovManager({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner,
        });
        break;

      case "xgovDaemon":
        res = await registryClient.send.setXgovDaemon({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner,
        });
        break;

      case "committeeManager":
        res = await registryClient.send.setCommitteeManager({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner,
        });
        break;

      case "xGovPayor":
        res = await registryClient.send.setPayor({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner,
        });
        break;

      case "kycProvider":
        res = await registryClient.send.setKycProvider({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner,
        });
        break;

      case "xGovCouncil":
        res = await registryClient.send.setXgovCouncil({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner,
        });
        break;

      case "xGovSubscriber":
        res = await registryClient.send.setXgovSubscriber({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner,
        });
        break;

      default:
        console.log("Role not found");
        return false;
    }

    if (
      res.confirmation.confirmedRound !== undefined &&
      res.confirmation.confirmedRound > 0 &&
      res.confirmation.poolError === ""
    ) {
      console.log("Transaction confirmed");
      setModalIsOpen(false);
      registryGlobalState.refetch(); // Refresh the roles after setting a new role
      return true;
    }

    console.log("Transaction not confirmed");
    return false;
  };

  if (registryGlobalState.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      <h1 className="text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold my-4">
        Admin Panel
      </h1>
      {activeAddress ? (
        <>
          {registryGlobalState.data?.xgovManager &&
            activeAddress === registryGlobalState.data?.xgovManager && (
              <div className="mx-auto max-w-[120rem] mb-10">
                <h2 className="text-xl font-semibold text-wrap text-algo-black dark:text-white mb-2">
                  Roles
                </h2>
                <RoleModal
                  isOpen={modalIsOpen}
                  onRequestClose={() => setModalIsOpen(false)}
                  role={selectedRole}
                  handleSubmitAddress={handleSubmitAddress}
                />
                <RoleList
                  registryGlobalState={registryGlobalState.data}
                  activeAddress={activeAddress}
                  xGovManager={registryGlobalState.data?.xgovManager}
                  handleSetRole={handleSetRole}
                />
              </div>
            )}
          {registryGlobalState.data?.kycProvider &&
            activeAddress === registryGlobalState.data?.kycProvider && (
              <div className="mx-auto max-w-[120rem] mb-10">
                {registryGlobalState.data?.kycProvider && (
                  <KYCBox
                    kycProvider={registryGlobalState.data?.kycProvider}
                    activeAddress={activeAddress}
                    transactionSigner={transactionSigner}
                  />
                )}

              </div>
            )}
          <div className="w-full relative text-algo-black dark:text-white">
            <PanelStatistics network={activeNetwork} />
          </div>
        </>
      ) : (
        <div>Wallet not connected</div>
      )}
    </div>
  );
}
