import { Link, type LinkProps } from "@/components/Link";
import { Page } from "@/components/Page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";

import { useState, type ComponentType } from "react";

import { useWallet } from "@txnlab/use-wallet-react";

import { KYCBox } from "./_KYCBox";
import { RoleList, RoleModal } from "./_RolesSection";
import { PanelStatistics } from "./_PanelStatistics"
import { VotingCohort } from "./_VotingCohort";
// import { useRegistryClient } from "@/contexts/RegistryClientContext";
import { RegistryClient as registryClient} from "src/algorand/contract-clients";
import { useRegistry } from "src/hooks/useRegistry";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";

const title = 'xGov';

export function AdminPage() {
  const { activeAddress, transactionSigner } = useWallet();
  const registryGlobalState = useRegistry(); 
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

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

    switch(selectedRole) {
      case 'xGovManager':
        res = await registryClient.send.setXgovManager({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner,
        });
        break;

      case 'committeePublisher':
        res = await registryClient.send.setCommitteePublisher({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner
        });
        break;

      case 'committeeManager':
        res = await registryClient.send.setCommitteeManager({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner
        });
        break;

      case 'xGovPayor':
        res = await registryClient.send.setPayor({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner
        });
        break;
        
      case 'kycProvider':
        res = await registryClient.send.setKycProvider({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner
        });
        break;

      case 'xGovReviewer':
        res = await registryClient.send.setXgovReviewer({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner
        });
        break;

      case 'xGovSubscriber':
        res = await registryClient.send.setXgovSubscriber({
          args: [address],
          sender: activeAddress,
          signer: transactionSigner
        });
        break;
      
      default:
        console.log('Role not found');
        return false;
    }

    
    if(res.confirmation.confirmedRound !== undefined && res.confirmation.confirmedRound > 0 && res.confirmation.poolError === '') {
      console.log('Transaction confirmed');
      setModalIsOpen(false);
      registryGlobalState.refetch() // Refresh the roles after setting a new role
      return true
    }
    
    console.log('Transaction not confirmed');
    return false;
  };

  if (registryGlobalState.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Page 
      title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}
      Sidebar={activeAddress ? (props: any) => <VotingCohort {...props} /> : undefined}
    >
      <div>
        <Breadcrumb className="-mb-[20px]">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
            Admin Panel
        </h1>
        {activeAddress ? (
          <>
            <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
             <PanelStatistics/>
            </div>
            {registryGlobalState.data?.xgovManager && activeAddress === registryGlobalState.data?.xgovManager && (
              <>
              <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
              Roles
            </h1>
            <RoleModal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} role={selectedRole} handleSubmitAddress={handleSubmitAddress} />
            <RoleList registryGlobalState={registryGlobalState.data} activeAddress={activeAddress} xGovManager={registryGlobalState.data?.xgovManager} handleSetRole={handleSetRole} />           
            </>
            )}
              {registryGlobalState.data?.kycProvider && activeAddress === registryGlobalState.data?.kycProvider && (
              <>
              <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                Know-Your-Customer Management
              </h1>
              <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
                {registryGlobalState.data?.kycProvider && (
                  <KYCBox kycProvider={registryGlobalState.data?.kycProvider} activeAddress={activeAddress} transactionSigner={transactionSigner} />
                )}
              </div>
              </>
              )}
              </>
        ) : (
          <div>Wallet not connected</div>
        )}
      </div>
    </Page>
  )
}