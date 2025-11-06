import { useState } from "react";

import { useWallet } from "@txnlab/use-wallet-react";

import { KYCBox } from "./KYCBox";
import { RoleList, RoleModal } from "./RolesSection";
import { PanelStatistics } from "./PanelStatistics";

import { addCouncilMember, registryClient } from "@/api";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { UseQuery, UseWallet, useCouncilMembers, useRegistry } from "@/hooks";
import { DepositFundsCard } from "@/components/DepositFundsCard/DepositFundsCard";
import { useAllRequestBoxes } from "@/hooks/useRequestBoxes";
import { SubscribeRequestList } from "@/components/SubscribeRequestList/SubscribeRequestList";
import { AddCouncilMemberModal, CouncilList } from "./CouncilSection";
import { useTransactionState } from "@/hooks/useTransactionState";
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
  const requests = useAllRequestBoxes();
  const councilMembersQuery = useCouncilMembers();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [addCouncilMemeberModalIsOpen, setAddCouncilMemberModalIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const {
    status: addCouncilMemberStatus,
    setStatus: setAddCouncilMemberStatus,
    errorMessage: addCouncilMemberErrorMessage,
    setErrorMessage: setAddCouncilMemberErrorMessage,
    isPending: isAddCouncilMemberPending
  } = useTransactionState()

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
    <div className="mx-auto w-full max-w-[120rem]">
      <h1 className="text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold my-4">
        Admin Panel
      </h1>
      {activeAddress ? (
        <>
          {
            registryGlobalState.data?.xgovManager &&
            activeAddress === registryGlobalState.data?.xgovManager && (
              <div className="mb-10">
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
            )
          }

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-wrap text-algo-black dark:text-white mb-2">
              xGov Subscribe Requests
            </h2>

            <SubscribeRequestList requests={requests.data} />
          </div>

          {
            registryGlobalState.data?.kycProvider &&
            activeAddress === registryGlobalState.data?.kycProvider && (
              <div className="mb-10">
                {registryGlobalState.data?.kycProvider && (
                  <KYCBox
                    kycProvider={registryGlobalState.data?.kycProvider}
                    activeAddress={activeAddress}
                    transactionSigner={transactionSigner}
                  />
                )}
              </div>
            )
          }
          <div className="w-full relative text-algo-black dark:text-white">
            <PanelStatistics network={activeNetwork} />
          </div>
          <DepositFundsCard />
          <div className="mb-10">
            <div className="flex items-center justify-start gap-4 mb-2">
              <h2 className="text-xl font-semibold text-wrap text-algo-black dark:text-white">
                Council Members <span className="ml-1 text-sm font-normal text-algo-black-60 dark:text-algo-black-20">{councilMembersQuery.data ? councilMembersQuery.data.length : 0} total</span>
              </h2>
              <Button
                onClick={() => setAddCouncilMemberModalIsOpen(true)}
                variant="default"
                size="sm"
              >
                Add Member
              </Button>
            </div>
            <AddCouncilMemberModal
              isOpen={addCouncilMemeberModalIsOpen}
              onRequestClose={() => setAddCouncilMemberModalIsOpen(false)}
              handleSubmitAddress={async (address) => {
                try {
                  await addCouncilMember({
                    activeAddress,
                    innerSigner: transactionSigner,
                    setStatus: setAddCouncilMemberStatus,
                    refetch: [councilMembersQuery.refetch],
                    address
                  })

                  setAddCouncilMemberModalIsOpen(false);
                  return true;
                }
                catch (e) {
                  console.error(e);
                  setAddCouncilMemberErrorMessage("An error occurred while adding the council member.");
                  return false;
                }
              }}
              memberState={{
                status: addCouncilMemberStatus,
                errorMessage: addCouncilMemberErrorMessage,
                isPending: isAddCouncilMemberPending
              }}
            />
            <CouncilList isAdmin={activeAddress === registryGlobalState.data?.xgovManager} />
          </div>
        </>
      ) : (
        <div>Wallet not connected</div>
      )}
    </div>
  );
}
