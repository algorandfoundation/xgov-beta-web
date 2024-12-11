import { Link, type LinkProps } from "@/components/Link";
import { Page } from "@/components/Page";
import { ProfileCard } from "@/components/ProfileCard/ProfileCard";
import { ProposalList } from "@/components/ProposalList/ProposalList";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useState, type ComponentType } from "react";

// mock data
import { mockProposals } from "@/components/ProposalList/ProposalList.stories";
import { useWallet } from "@txnlab/use-wallet-react";
import { useStore } from "@nanostores/react";
import { $registryContractStore } from "@/stores/registryStore";
import { AlgorandClient } from "src/algorand/algo-client";
import { RegistryAppID, RegistryClient } from "src/algorand/contract-clients";
import algosdk, { makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { Buffer } from 'buffer';
import { useQuery } from "@tanstack/react-query";
import { getProposalsByProposer } from "src/api/proposals";

const title = 'xGov';

function RulesCard() {
    return (
        <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-xl lg:min-w-[36rem]">
            <div className="max-w-3xl min-h-[36rem]">
                <h2 className="text-xl font-bold mt-2 mb-4">Platform Rules</h2>
            </div>
        </div>
    )
}

function RulesCardAndTitle() {
    return (
        <>
            <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                Rules
            </h1>
            <RulesCard />
        </>
    )
}

export function ProfilePage() {
    const { transactionSigner, activeAddress } = useWallet();
    const registryStatus = useStore($registryContractStore);

    const [newProposalLoading, setNewProposalLoading] = useState<boolean>(false);

    const proposals = useQuery({
        queryKey: ['getProposalsByProposer', activeAddress],
        queryFn: () => getProposalsByProposer(activeAddress!),
        enabled: !!activeAddress
    })

    const newProposal = async () => {
        if (!activeAddress) return;

        setNewProposalLoading(true);

        const suggestedParams = await AlgorandClient.getSuggestedParams();

        const payment = makePaymentTxnWithSuggestedParamsFromObject({
            from: activeAddress,
            to: algosdk.getApplicationAddress(RegistryAppID),
            amount: registryStatus.globalState.proposalFee.asBigInt(),
            suggestedParams,
        });

        await RegistryClient.send.openProposal(
            {
                sender: activeAddress,
                signer: transactionSigner,
                args: { payment },
                boxReferences: [
                    new Uint8Array(
                        Buffer.concat([
                            Buffer.from('p'),
                            algosdk.decodeAddress(activeAddress).publicKey
                        ])
                    ),
                ]
            }
        ).catch((e: Error) => {
            alert(`Error calling the contract: ${e.message}`)
            setNewProposalLoading(false);
            return
        });
        
        setNewProposalLoading(false);
    }

    return (
        <Page
            title={title}
            LinkComponent={Link as unknown as ComponentType<LinkProps>}
            Sidebar={() => <RulesCardAndTitle />}
        >
            <div>
                <Breadcrumb className="-mb-[20px]">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Profile</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                    My Profile
                </h1>
                <ProfileCard
                    activeAddress={activeAddress!}
                    votingAddress={registryStatus.votingAddress}
                    isXGov={registryStatus.isXGov}
                    isProposer={registryStatus.isProposer}
                    validKYC={(registryStatus.proposer?.kycStatus && registryStatus.proposer?.kycExpiring > Date.now()) || false}
                />
                <div className="flex items-center gap-2 mt-16 mb-8">
                    <h1 className="text-3xl lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold">
                        My Proposals
                    </h1>
                    <button
                        type='button'
                        className="border-2 hover:border-b-[3px] text-xs text-algo-black dark:text-algo-blue-20 border-algo-black dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 transition"
                        onClick={newProposal}
                        disabled={!registryStatus.isProposer}
                    >
                        { newProposalLoading ? 'Loading...' : 'New Proposal'}
                    </button>
                </div>
                {
                    !!proposals.data && <ProposalList proposals={proposals.data} />
                }
            </div>
        </Page>
    )
}