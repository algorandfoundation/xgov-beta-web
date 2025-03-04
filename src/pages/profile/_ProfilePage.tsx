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
import { useWallet } from "@txnlab/use-wallet-react";
import { AlgorandClient } from "src/algorand/algo-client";
import { RegistryAppID, RegistryClient } from "src/algorand/contract-clients";
import algosdk, { ALGORAND_MIN_TX_FEE, makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { Buffer } from 'buffer';
import { useProposer, useXGov, useRegistry } from "src/hooks/useRegistry";
import { useProposalsByProposer } from "src/hooks/useProposals";
import { useNavigate, useParams } from "react-router-dom";
import { shortenAddress } from "@/functions/shortening";
import { Button } from "@/components/ui/button";
import XGovProposerStatusPill from '@/components/XGovProposerStatusPill/XGovProposerStatusPill';

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
    const navigate = useNavigate();
    const { address } = useParams();
    const { transactionSigner, activeAddress } = useWallet();
    const registry = useRegistry();
    const xgov = useXGov(activeAddress);
    const proposer = useProposer(activeAddress);
    const proposals = useProposalsByProposer(activeAddress);

    const isLoading = registry.isLoading || xgov.isLoading || proposer.isLoading || proposals.isLoading;
    const isError = registry.isError || xgov.isError || proposer.isError || proposals.isError;

    const [subscribeXGovLoading, setSubscribeXGovLoading] = useState<boolean>(false);
    const [setVotingAddressLoading, setSetVotingAddressLoading] = useState<boolean>(false);
    const [subscribeProposerLoading, setSubscribeProposerLoading] = useState<boolean>(false);

    const [newProposalLoading, setNewProposalLoading] = useState<boolean>(false);

    // !activeAddress && navigate('/');
    // activeAddress !== address && navigate(`/profile/${activeAddress}`);

    const validProposer =
        (
            proposer?.data
            && proposer.data.kycStatus
            && proposer.data.kycExpiring > Date.now()
        ) || false


    if (!activeAddress || isLoading) {
        return (
            <div>Loading...</div>
        )
    }

    if (isError) {
        return (
            <div>Error...</div>
        )
    }

    const subscribeXgov = async () => {
        setSubscribeXGovLoading(true);

        const suggestedParams = await AlgorandClient.getSuggestedParams();

        const payment = makePaymentTxnWithSuggestedParamsFromObject({
            from: activeAddress,
            to: algosdk.getApplicationAddress(RegistryAppID),
            amount: 1_000_000,
            suggestedParams,
        })

        await RegistryClient.send.subscribeXgov({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
                payment,
                votingAddress: activeAddress
            },
            boxReferences: [
                new Uint8Array(
                    Buffer.concat([
                        Buffer.from('x'),
                        algosdk.decodeAddress(activeAddress).publicKey
                    ])
                ),
            ]
        }).catch((e: Error) => {
            console.error(`Error calling the contract: ${e.message}`)
            setSubscribeXGovLoading(false);
            return
        });

        xgov.refetch();
        setSubscribeXGovLoading(false);
    }

    const setVotingAddress = async (address: string) => {
        setSetVotingAddressLoading(true);

        await RegistryClient.send.setVotingAccount({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
                xgovAddress: activeAddress,
                votingAddress: address
            },
            boxReferences: [
                new Uint8Array(
                    Buffer.concat([
                        Buffer.from('x'),
                        algosdk.decodeAddress(activeAddress).publicKey
                    ])
                ),
            ]
        }).catch((e: Error) => {
            console.error(`Error calling the contract: ${e.message}`)
            setSetVotingAddressLoading(false);
            return
        });


        await proposer.refetch();
        setSetVotingAddressLoading(false);
    }

    const unsubscribeXgov = async () => {
        setSubscribeXGovLoading(true);

        await RegistryClient.send.unsubscribeXgov({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
                xgovAddress: activeAddress
            },
            extraFee: ALGORAND_MIN_TX_FEE.microAlgos(),
            boxReferences: [
                new Uint8Array(
                    Buffer.concat([
                        Buffer.from('x'),
                        algosdk.decodeAddress(activeAddress).publicKey
                    ])
                ),
            ]
        }).catch((e: Error) => {
            console.error(`Error calling the contract: ${e.message}`)
            setSubscribeXGovLoading(false);
            return
        });

        await Promise.all([
            xgov.refetch(),
            proposer.refetch(),
        ])
        setSubscribeXGovLoading(false);
    }

    const subscribeProposer = async () => {
        setSubscribeProposerLoading(true);

        const suggestedParams = await AlgorandClient.getSuggestedParams();

        const payment = makePaymentTxnWithSuggestedParamsFromObject({
            from: activeAddress,
            to: algosdk.getApplicationAddress(RegistryAppID),
            amount: 10_000_000,
            suggestedParams,
        })

        await RegistryClient.send.subscribeProposer({
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
        }).catch((e: Error) => {
            console.error(`Error calling the contract: ${e.message}`)
            setSubscribeProposerLoading(false);
            return
        });

        await proposer.refetch();
        setSubscribeProposerLoading(false);
    }

    const newProposal = async () => {
        if (!activeAddress) return;

        setNewProposalLoading(true);

        const suggestedParams = await AlgorandClient.getSuggestedParams();

        const proposalFee = registry.data?.proposalFee;

        if (!proposalFee) {
            throw new Error('Proposal fee not found');
        }

        const payment = makePaymentTxnWithSuggestedParamsFromObject({
            from: activeAddress,
            to: algosdk.getApplicationAddress(RegistryAppID),
            amount: proposalFee,
            suggestedParams,
        });

        await RegistryClient.send.openProposal({
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
        }).catch((e: Error) => {
            console.error(`Error calling the contract: ${e.message}`)
            setNewProposalLoading(false);
            return
        });

        setNewProposalLoading(false);
    }

    return (
        <Page
            title={title}
            LinkComponent={Link as unknown as ComponentType<LinkProps>}
        >
            <div className="relative isolate overflow-hidden bg-white dark:bg-algo-black px-6 lg:px-8 py-24 min-h-[calc(100svh-10.625rem)] lg:overflow-visible">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{(!!address && address === activeAddress) && 'My'} Profile</BreadcrumbPage>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {
                                !!address && (
                                    <>
                                        <BreadcrumbPage className="hidden md:inline">{address}</BreadcrumbPage>
                                        <BreadcrumbPage className="inline md:hidden">{shortenAddress(address)}</BreadcrumbPage>
                                    </>
                                )
                            }
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <ProfileCard
                    activeAddress={activeAddress!}
                    votingAddress={xgov.data?.votingAddress || ''}
                    setVotingAddress={setVotingAddress}
                    setVotingAddressLoading={setVotingAddressLoading}
                    isXGov={xgov.data?.isXGov || false}
                    subscribeXgov={subscribeXgov}
                    unsubscribeXgov={unsubscribeXgov}
                    subscribeXGovLoading={subscribeXGovLoading}
                    proposer={proposer.data}
                    subscribeProposer={subscribeProposer}
                    subscribeProposerLoading={subscribeProposerLoading}
                    className="mt-6"
                />
                {
                    validProposer && (
                        <>
                            <div className="flex gap-6">
                                <XGovProposerStatusPill proposer={proposer.data} />
                            </div>
                            <div className="flex items-center gap-2 my-8">
                                <Button
                                    size='sm'
                                    type='button'
                                    onClick={newProposal}
                                    disabled={!proposer.data?.isProposer}
                                >
                                    {newProposalLoading ? 'Loading...' : 'New Proposal'}
                                </Button>
                            </div>
                            {
                                !!proposals.data && <ProposalList proposals={proposals.data} />
                            }
                        </>
                    )
                }
            </div>
        </Page>
    )
}