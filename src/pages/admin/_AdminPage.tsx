import { Link, type LinkProps } from "@/components/Link";
import { Page } from "@/components/Page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";

import { useState, useEffect, type ComponentType } from "react";

import { useWallet } from "@txnlab/use-wallet-react";

import { KYCBox } from "./_KYCBox";
import { RoleList, RoleModal } from "./_RolesSection";
import { PanelStatistics, type panelStatisticsData } from "./_PanelStatistics"
import { VotingCohort } from "./_VotingCohort";
import { useRegistryClient } from "@/contexts/RegistryClientContext";

// Mock data in frontend
import { mockProposals } from "@/components/ProposalList/ProposalList.stories.tsx";

const title = 'xGov';

const mockPanelStatisticsData: panelStatisticsData = {
  xGovs: 10,
  proposals: mockProposals
}

export function AdminPage() {
  const { activeAddress, transactionSigner } = useWallet();
  const { registryClient, loading, roles, refreshBoxes } = useRegistryClient();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const handleSetRole = (role: string) => {
    setSelectedRole(role);
    setModalIsOpen(true);
    console.log(`Opening modal for role: ${role}`); // Debugging log
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

      case 'kycProvider':
        res = await registryClient.send.setKycProvider({
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
      refreshBoxes(); // Refresh the roles after setting a new role
      return true
    }
    
    console.log('Transaction not confirmed');
    return false;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Page 
      title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}
      Sidebar={activeAddress ? VotingCohort as unknown as ComponentType : undefined}
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
              {PanelStatistics(mockPanelStatisticsData)}
            </div>
            {roles.xGovManager && activeAddress === roles.xGovManager && (
              <>
              <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
              Roles
            </h1>
            <RoleModal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} role={selectedRole} handleSubmitAddress={handleSubmitAddress} />
            <RoleList roles={roles} activeAddress={activeAddress} xGovManager={roles.xGovManager} handleSetRole={handleSetRole} />           
            </>
            )}
              {roles.xGovManager && activeAddress === roles.xGovManager && (
              <>
              <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                Know-Your-Customer Management
              </h1>
              <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
                {roles.kycProvider && (
                  <KYCBox kycProvider={roles.kycProvider} activeAddress={activeAddress} transactionSigner={transactionSigner} />
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