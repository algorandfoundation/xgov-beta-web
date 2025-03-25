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
import { AlgorandClient as algorand } from "src/algorand/algo-client";
import { RegistryAppID, RegistryClient } from "src/algorand/contract-clients";
import algosdk, { ALGORAND_MIN_TX_FEE, makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { Buffer } from 'buffer';
import { useProposer, useXGov, useRegistry } from "src/hooks/useRegistry";
import { useProposalsByProposer } from "src/hooks/useProposals";
import { useNavigate, useParams } from "react-router-dom";
import { shortenAddress } from "@/functions/shortening";
import { Button } from "@/components/ui/button";
import XGovProposerStatusPill from '@/components/XGovProposerStatusPill/XGovProposerStatusPill';
import { ProposalStatus } from "@/types/proposals";
import { InfinityMirrorButton } from "@/components/button/InfinityMirrorButton/InfinityMirrorButton";

const title = 'xGov';

const activeStatuses = [
    // ProposalStatus.ProposalStatusEmpty,
    ProposalStatus.ProposalStatusDraft,
    ProposalStatus.ProposalStatusFinal,
    ProposalStatus.ProposalStatusVoting,
    ProposalStatus.ProposalStatusApproved,
    ProposalStatus.ProposalStatusRejected,
    ProposalStatus.ProposalStatusReviewed,
    // ProposalStatus.ProposalStatusFunded,
    ProposalStatus.ProposalStatusBlocked,
    ProposalStatus.ProposalStatusDelete,
]

export function ProfilePage() {
    const navigate = useNavigate();
    const { address } = useParams();
    const { transactionSigner, activeAddress } = useWallet();
    const registry = useRegistry();
    const xgov = useXGov(activeAddress);
    const proposer = useProposer(activeAddress);
    const proposalsData = useProposalsByProposer(activeAddress);

    const isLoading = registry.isLoading || xgov.isLoading || proposer.isLoading || proposalsData.isLoading;
    const isError = registry.isError || xgov.isError || proposer.isError || proposalsData.isError;

    const [subscribeXGovLoading, setSubscribeXGovLoading] = useState<boolean>(false);
    const [setVotingAddressLoading, setSetVotingAddressLoading] = useState<boolean>(false);
    const [subscribeProposerLoading, setSubscribeProposerLoading] = useState<boolean>(false);

    const validProposer =
        (
            proposer?.data
            && proposer.data.kycStatus
            && proposer.data.kycExpiring > (Date.now() / 1000)
        ) || false

    const hasCurrentProposal = proposalsData.data?.some(proposal => activeStatuses.includes(proposal.status))

    const proposals = proposalsData.data?.filter(proposal => proposal.status !== ProposalStatus.ProposalStatusEmpty);

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

        const suggestedParams = await algorand.getSuggestedParams();

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

        const suggestedParams = await algorand.getSuggestedParams();

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
                            <BreadcrumbPage>{(!!address && address === activeAddress) && 'My '}Profile</BreadcrumbPage>
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
                            <div className="flex gap-6 mb-4">
                                <XGovProposerStatusPill proposer={proposer.data} />
                                <Link to='/new'>
                                    <InfinityMirrorButton variant='secondary'>
                                        New Proposal
                                    </InfinityMirrorButton>
                                </Link>
                            </div>
                            {
                                !!proposals && <ProposalList proposals={proposals} />
                            }
                        </>
                    )
                }
            </div>
        </Page>
    )
}