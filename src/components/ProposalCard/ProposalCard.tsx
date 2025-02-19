import { FocusMap, isProposalInfoCardDetails, isProposalSummaryCardDetails, ProposalFundingTypeMap, ProposalStatus, statusToPhase, type ProposalCardDetails, type ProposalInfoCardDetails, type ProposalMainCardDetails, type ProposalSummaryCardDetails } from "@/types/proposals";
import { cn } from "@/functions/utils";
import { Link } from "@/components/Link";
import { shortenAddress } from "@/functions/shortening";
import { capitalizeFirstLetter } from "@/functions/capitalization";
import { useState } from "react";
import { ProposalFactory } from "@algorandfoundation/xgov";
import { AlgorandClient as algorand } from 'src/algorand/algo-client';
import { RegistryClient as registryClient } from "src/algorand/contract-clients";



export interface ProposalCardProps {
    /**
     * Router Path
     */
    path?: string;
    proposal: ProposalCardDetails;
    mini?: boolean;
    activeAddress?: string | null;
    transactionSigner?: any;
    refetcher?: () => void;
}

export function ProposalCard({
    proposal,
    path = '',
    mini = false,
    activeAddress = null,
    transactionSigner = null,
    refetcher = () => {}
}: ProposalCardProps) { 

    if (isProposalInfoCardDetails(proposal)) {
        return (
            <ProposalInfoCard proposal={proposal} />
        )
    }

    if (isProposalSummaryCardDetails(proposal)) {
        if (mini) {
            return (
                <MyProposalSummaryCard path={path} proposal={proposal} />
            )
        }

        return (
            <ProposalSummaryCard
                path={path}
                proposal={proposal}
                activeAddress={activeAddress}
                transactionSigner={transactionSigner}
                refetcher={refetcher}
            />
        )
    }

    // implicitly main card
    const { status, description, team, additionalInfo, pastProposalLinks } = proposal as ProposalMainCardDetails;

    const phase = statusToPhase[status];

    return (
        <li role="listitem" className="list-none relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
            <div className="absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end gap-4">
                <div>
                    <span className="text-xl">[</span>
                    <span
                        className={cn(
                            phase === 'draft' ? 'text-algo-black-60' : '',
                            phase === 'submission' ? 'text-algo-blue dark:text-algo-teal' : '',
                            phase === 'discussion' ? 'text-algo-blue dark:text-algo-teal' : '',
                            phase === 'voting' ? 'text-algo-teal' : '',

                            "p-0.5 px-1 lg:text-lg"
                        )}>

                        {capitalizeFirstLetter(phase)}

                    </span>
                    <span className="text-xl">]</span>
                </div>
            </div>

            <div className="max-w-3xl">
                <h2 className="text-3xl font-bold mt-2 mb-4">Description</h2>
                <p className="text-xl dark:text-algo-blue-10">{description}</p>

                <h2 className="text-3xl font-bold my-4">About the team</h2>
                <p className="text-xl dark:text-algo-blue-10">{team}</p>

                <h2 className="text-3xl font-bold my-4">Additional Info</h2>
                <p className="text-xl dark:text-algo-blue-10">{additionalInfo}</p>

                {
                    !!pastProposalLinks && !!pastProposalLinks.length && (
                        <>
                            <h2 className="text-3xl font-bold my-4">Past Proposals</h2>
                            <ul className="text-xl dark:text-algo-blue-10 flex flex-col gap-2 ">
                                {pastProposalLinks.map((pastProposal) => (
                                    <li key={pastProposal} className="truncate">
                                        <Link
                                            key={pastProposal}
                                            className="hover:text-algo-teal dark:hover:text-algo-blue"
                                            to={'/proposal/' + pastProposal}
                                        >
                                            {pastProposal.toString()}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )
                }
            </div>
        </li>
    )
}

interface ProposalSummaryCardProps {
    /**
     * Router Path
     */
    path?: string;
    proposal: ProposalSummaryCardDetails;
    activeAddress: string | null;
    transactionSigner: any;
    refetcher: () => void;
}

function ProposalSummaryCard({
    path,
    proposal: {
        id,
        title,
        status,
        focus,
        fundingType,
        requestedAmount,
        proposer
    },
    activeAddress,
    transactionSigner,
    refetcher,
}: ProposalSummaryCardProps) {
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

    const phase = statusToPhase[status];

    const handleOpenFinalizeModal = () => {
        setIsFinalizeModalOpen(true);
    };

    const handleCloseFinalizeModal = () => {
        setIsFinalizeModalOpen(false);
    };

    return (
        <li role="listitem" className="list-none relative flex bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
            <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-lg text-wrap lg:text-2xl mb-3 lg:mb-6 font-bold">{title} {(proposer == activeAddress) && ("🫵")}</h3>
                <p className="text-xl">{FocusMap[focus]}</p>
                <p className="text-xl">{ProposalFundingTypeMap[fundingType]}</p>
                <p className="text-xl">{(Number(requestedAmount) / 1_000_000).toLocaleString()} ALGO</p>
            </div>

            <div className="flex flex-col items-end">
                <div>
                    <span className="text-xl">[</span>
                    <span
                        className={cn(
                            phase === 'draft' ? 'text-algo-black-60' : '',
                            phase === 'submission' ? 'text-algo-blue dark:text-algo-teal' : '',
                            phase === 'discussion' ? 'text-algo-blue dark:text-algo-teal' : '',
                            phase === 'voting' ? 'text-algo-teal' : '',

                            "p-0.5 px-1 lg:text-lg"
                        )}>

                        {capitalizeFirstLetter(phase)}

                    </span>
                    <span className="text-xl">]</span>
                </div>
                <p className="text-lg my-1 mr-2">- {proposer.length === 58 ? shortenAddress(proposer) : proposer}</p>
            </div>

            <div className="absolute bottom-0 right-0 mb-4 mr-4 flex flex-col items-center gap-2">
                <Link
                    data-testid="proposol-link"
                    className={cn(
                        path === `/proposal/${id}` ? 'bg-algo-blue' : '',
                        "text-xl font-semi-bold hover:text-algo-teal dark:hover:text-algo-blue"
                    )}
                    to={`/proposal/${Number(id)}`}
                >
                    Read More
                </Link>
                {(proposer == activeAddress) && status === ProposalStatus.ProposalStatusDraft && (
                    <button
                        className="text-xl font-semi-bold text-algo-teal dark:text-algo-blue"
                        onClick={handleOpenFinalizeModal}
                    >
                        Submit for Vote
                    </button>
                )}
            </div>
            <FinalizeModal
                isOpen={isFinalizeModalOpen}
                onClose={handleCloseFinalizeModal}
                proposalId={id}
                activeAddress={activeAddress ?? ''}
                transactionSigner={transactionSigner}
                refetcher={refetcher}
            />
        </li>
    )
}


interface MyProposalSummaryCardProps {
    path?: string;
    proposal: ProposalSummaryCardDetails;
}

function MyProposalSummaryCard({
    proposal: {
        id,
        title,
        status,
        focus,
        fundingType,
        requestedAmount,
    }
}: MyProposalSummaryCardProps) {

    const phase = statusToPhase[status];


    return (
        <li className="list-none bg-white hover:bg-algo-teal-10 dark:hover:bg-algo-blue-50 dark:bg-algo-black border-2 border-algo-black hover:border-algo-teal dark:border-white dark:hover:border-algo-blue-40 text-algo-black dark:text-white rounded-lg max-w-3xl">
            <div className="p-2">
                <Link to={`/proposal/${id}`}>
                    <div className="flex items-center">
                        <h3 className="text-lg w-full font-bold truncate">{title}</h3>
                        <div>
                            <span className="text-xl">[</span>
                            <span
                                className={cn(
                                    phase === 'draft' ? 'text-algo-black-60' : '',
                                    phase === 'submission' ? 'text-algo-blue dark:text-algo-teal' : '',
                                    phase === 'discussion' ? 'text-algo-blue dark:text-algo-teal' : '',
                                    phase === 'voting' ? 'text-algo-teal' : '',
                                    "p-0.5 px-1 lg:text-lg"
                                )}>

                                {capitalizeFirstLetter(phase)}

                            </span>
                            <span className="text-xl">]</span>
                        </div>
                    </div>

                    <div className="w-full flex items-center justify-between gap-4">
                        <div className="flex">
                            <span className="w-36 text-lg font-normal">{focus}</span>
                            <span className="w-36 text-lg font-normal">{ProposalFundingTypeMap[fundingType]}</span>
                            <span className="text-lg font-normal">{requestedAmount.toLocaleString()} ALGO</span>
                        </div>
                    </div>
                </Link>
            </div>
        </li>
    )
}

interface ProposalProps {
    proposal: ProposalInfoCardDetails;
}

function ProposalInfoCard({ proposal: { forumLink, fundingType, focus, openSource, requestedAmount, status } }: ProposalProps) {
    return (
        <li role="listitem" className="list-none relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-xl lg:min-w-[36rem]">
            <div className="max-w-3xl">
                <h2 className="text-xl font-bold mt-2 mb-4">Discussion Link</h2>
                <Link className="text-xl font-normal dark:text-algo-blue-10 hover:text-algo-teal dark:hover:text-algo-blue" to={forumLink}>{forumLink}</Link>

                <h2 className="text-xl font-bold my-4">Funding Type</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{ProposalFundingTypeMap[fundingType]}</p>

                <h2 className="text-xl font-bold my-4">Category</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{FocusMap[focus]}</p>

                <h2 className="text-xl font-bold my-4">Open Source</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{openSource ? '✅' : '❌'}</p>

                <h2 className="text-xl font-bold my-4">Ask</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10 mb-6 lg:mb-14">{(Number(requestedAmount) / 1_000_000).toLocaleString()} ALGO</p>

                {status === ProposalStatus.ProposalStatusBlocked && (
                    <>
                    <h2 className="text-xl font-bold my-4">VETOED BY XGOV REVIEWER!</h2>
                    <p className="text-xl font-normal dark:text-algo-blue-10 mb-6 lg:mb-14">Proposal in violation of xGov T&C!</p>
                    </>

                )}

                {status === ProposalStatus.ProposalStatusReviewed && (
                    <>
                    <h2 className="text-xl font-bold my-4">xGov Reviewer has reviewed</h2>
                    <p className="text-xl font-normal dark:text-algo-blue-10 mb-6 lg:mb-14">Proposal conforms with xGov T&C.</p>
                    </>

                )}

                {status === ProposalStatus.ProposalStatusFunded && (
                    <h2 className="text-xl font-bold my-4">Proposal funded!</h2>
                )}
            </div>
        </li>
    )
}

interface FinalizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposalId: bigint;
    activeAddress: string | null;
    transactionSigner: any;
    refetcher: () => void;
}

export function FinalizeModal({
    isOpen,
    onClose,
    proposalId,
    activeAddress,
    transactionSigner,
    refetcher,
}: FinalizeModalProps) {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            if (!activeAddress || !transactionSigner) {
                setErrorMessage("Wallet not connected.");
                return false;
            }

            const proposalFactory = new ProposalFactory({ algorand });
            const proposalClient = proposalFactory.getAppClientById({ appId: proposalId });

            const res = await proposalClient.send.finalize({
                sender: activeAddress,
                signer: transactionSigner,
                args: {},
                appReferences: [registryClient.appId],
                accountReferences: [activeAddress],
                extraFee: (1000).microAlgos(),
            });

            if (res.confirmation.confirmedRound !== undefined && res.confirmation.confirmedRound > 0 && res.confirmation.poolError === '') {
                console.log('Transaction confirmed');
                setErrorMessage(null);
                onClose();
                refetcher();
                return true;
            }

            console.log('Transaction not confirmed');
            setErrorMessage("Transaction not confirmed.");
            return false;
        } catch (error) {
            console.error('Error during finalize:', error);
            setErrorMessage("An error occurred calling the proposal contract.");
            return false;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-algo-black p-4 rounded-lg max-w-lg w-full">
                <button className="absolute top-2 right-2 text-xl" onClick={onClose}>×</button>
                <h2 className="text-2xl font-bold mb-4">Submit Proposal for Vote</h2>
                <p>Are you sure you want to submit this proposal for voting?</p>
                <p>Once submitted, you cannot edit any further.</p>
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                <div className="mt-4 flex justify-end gap-2">
                    <button className="bg-gray-300 dark:bg-gray-700 p-2 rounded" onClick={onClose}>Cancel</button>
                    <button className="bg-algo-teal dark:bg-algo-blue text-white p-2 rounded" onClick={handleSubmit}>Submit</button>
                </div>
            </div>
        </div>
    );
}