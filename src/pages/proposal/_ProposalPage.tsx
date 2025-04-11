import BracketedPhaseDetail from "@/components/BracketedPhaseDetail/BracketedPhaseDetail";
import FocusDetail from "@/components/FocusDetail/FocusDetail";
import FundingTypeDetail from "@/components/FundingTypeDetail/FundingTypeDetail";
import { BlockIcon } from "@/components/icons/BlockIcon";
import { Link, useNavigate } from "react-router-dom";
import LoraPillLink from "@/components/LoraPillLink/LoraPillLink";
import { Page } from "@/components/Page";
import ProposalReviewerCard from "@/components/ProposalReviewerCard/ProposalReviewerCard";
import RequestedAmountDetail from "@/components/RequestedAmountDetail/RequestedAmountDetail";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useWallet } from "@txnlab/use-wallet-react";
import { useParams } from "react-router-dom";
import { useGetAllProposals, useProposal, useProposalsByProposer } from "src/hooks/useProposals";
import { useRegistry } from "src/hooks/useRegistry";
import UserPill from "@/components/UserPill/UserPill";
import VoteCounter from "@/components/VoteCounter/VoteCounter";
import { ProposalCategory, ProposalStatus, ProposalStatusMap, type ProposalBrief, type ProposalMainCardDetails } from "@/types/proposals";
import { cn } from "@/functions/utils";
import { ChatBubbleLeftIcon } from "@/components/icons/ChatBubbleLeftIcon";
import { useState } from "react";
import { ProposalFactory } from "@algorandfoundation/xgov";
import { AlgorandClient as algorand } from 'src/algorand/algo-client';
import { RegistryClient as registryClient } from "src/algorand/contract-clients";
import { InfinityMirrorButton } from "@/components/button/InfinityMirrorButton/InfinityMirrorButton";
import { Button } from "@/components/ui/button";
import { SquarePenIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";

const title = 'xGov';

function getDiscussionDuration(category: ProposalCategory, durations: [bigint, bigint, bigint, bigint]): bigint {
    switch (category) {
        case ProposalCategory.ProposalCategorySmall:
            return durations[0];
        case ProposalCategory.ProposalCategoryMedium:
            return durations[1];
        case ProposalCategory.ProposalCategoryLarge:
            return durations[2];
        default:
            return BigInt(0);
    }
}

export function ProposalPage() {
    const { activeAddress } = useWallet();
    const registryGlobalState = useRegistry();
    // TODO: Get NFD name using the activeAddress
    const { proposal: proposalId } = useParams();
    const proposal = useProposal(Number(proposalId));
    const pastProposals = useProposalsByProposer(proposal.data?.proposer);
    const allProposals = useGetAllProposals();

    if (proposal.isLoading || registryGlobalState.isLoading) {
        return <LoadingSpinner />
    }

    if (proposal.isError) {
        console.log('error', proposal.error);
        return (
            <div>
                <div>Encountered an error: {proposal.error.message}</div>
                <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Return to Homepage?
                </Link>
            </div>
        );
    }

    if (registryGlobalState.isError) {
        console.log('error', proposal.error);
        return (
            <div>
                <div>Encountered an error: {registryGlobalState.error.message}</div>
                <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Return to Homepage?
                </Link>
            </div>
        );
    }

    if (!proposal.data) {
        return (
            <div>
                <div>Proposal not found!</div>
                <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Return to Homepage?
                </Link>
            </div>
        );
    }

    if (!registryGlobalState.data) {
        return (
            <div>
                <div>Something went wrong</div>
                <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Return to Homepage?
                </Link>
            </div>
        );
    }

    const discussionDuration = Date.now() - (proposal.data?.submissionTime * 1000);
    const minimumDiscussionDuration = getDiscussionDuration(proposal.data?.category, registryGlobalState.data?.discussionDuration) * 1000n;

    return (
        <Page
            title={title}
            Sidebar={() =>
                <>
                    {registryGlobalState.data?.xgovReviewer && activeAddress && activeAddress === registryGlobalState.data?.xgovReviewer && (
                        <ProposalReviewerCard
                            proposalId={proposal.data.id}
                            status={proposal.data.status}
                            refetch={proposal.refetch}
                        />
                    )}
                </>
            }>
            <ProposalInfo
                proposal={proposal.data}
                pastProposals={pastProposals.data}
            >
                <div className="flex lg:flex-col items-end justify-between gap-2 text-white lg:-mt-16 mx-4 lg:mx-0 my-4 p-2">
                    <RequestedAmountDetail requestedAmount={proposal.data.requestedAmount} />
                    <FocusDetail focus={proposal.data.focus} />
                    <FundingTypeDetail fundingType={proposal.data.fundingType} />
                </div>
                <StatusCard
                    proposal={proposal.data}
                    refetchProposal={proposal.refetch}
                    refetchAllProposals={allProposals.refetch}
                    discussionDuration={discussionDuration}
                    minimumDiscussionDuration={minimumDiscussionDuration}
                />
            </ProposalInfo>
        </Page >
    )
}

export interface StatusCardProps {
    className?: string;
    proposal: ProposalMainCardDetails;
    refetchProposal: () => void;
    refetchAllProposals: () => void;
    discussionDuration: number;
    minimumDiscussionDuration: bigint;
}

export const statusCardMap = {
    [ProposalStatus.ProposalStatusEmpty]: {
        header: 'This proposal is empty',
        subHeader: '',
        icon: '',
        actionText: '',
        link: ''
    },
    [ProposalStatus.ProposalStatusDraft]: {
        header: 'Proposal is being discussed',
        subHeader: 'Take part in the discussion and help shape public sentiment on this proposal.',
        icon: <ChatBubbleLeftIcon aria-hidden="true" className="size-24 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
        actionText: 'View the discussion',
        link: ''
    },
    [ProposalStatus.ProposalStatusFinal]: {
        header: 'Proposal is being discussed',
        subHeader: 'Take part in the discussion and help shape public sentiment on this proposal.',
        icon: <ChatBubbleLeftIcon aria-hidden="true" className="size-24 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
        actionText: 'View the discussion',
        link: ''
    },
    [ProposalStatus.ProposalStatusVoting]: {
        header: 'Vote on this proposal',
        subHeader: 'Vote on this proposal to help fund it.',
        icon: <BlockIcon className="size-18 stroke-algo-blue dark:stroke-algo-teal" />,
        actionText: 'You\'re not eligible to vote',
        link: ''
    },
    [ProposalStatus.ProposalStatusApproved]: {
        header: 'Proposal Approved!',
        subHeader: '',
        icon: '',
        actionText: '',
        link: ''
    },
    [ProposalStatus.ProposalStatusRejected]: {
        header: 'Proposal has been rejected',
        subHeader: '',
        icon: '',
        actionText: '',
        link: ''
    },
    [ProposalStatus.ProposalStatusReviewed]: {
        header: 'Proposal has been approved and deemed to conform with the xGov T&C.',
        subHeader: '',
        icon: '',
        actionText: '',
        link: ''
    },
    [ProposalStatus.ProposalStatusFunded]: {
        header: 'Proposal Funded!',
        subHeader: '',
        icon: '',
        actionText: '',
        link: ''
    },
    [ProposalStatus.ProposalStatusBlocked]: {
        header: 'Proposal has been Blocked by xGov Reviewer.',
        subHeader: '',
        icon: '',
        actionText: '',
        link: ''
    },
    [ProposalStatus.ProposalStatusDelete]: {
        header: 'Proposal has been deleted',
        subHeader: '',
        icon: '',
        actionText: '',
        link: ''
    },
}

export function StatusCard({ className = '', proposal, refetchProposal, refetchAllProposals, discussionDuration, minimumDiscussionDuration }: StatusCardProps) {
    const navigate = useNavigate();
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [isDropModalOpen, setIsDropModalOpen] = useState(false);

    const { activeAddress, transactionSigner } = useWallet();

    const finalizable = discussionDuration > minimumDiscussionDuration;
    const [days, hours, minutes] = useTimeLeft(Date.now() + (Number(minimumDiscussionDuration) - discussionDuration));
    const remainingTime = `${days}d ${hours}h ${minutes}m remaining`;

    const details = statusCardMap[proposal.status as keyof typeof statusCardMap];

    if (proposal.status === ProposalStatus.ProposalStatusDraft) {
        details.subHeader = `Discussion is ongoing (${remainingTime}), take part and help shape public sentiment on this proposal.`;
    }

    if (!finalizable && proposal.proposer === activeAddress) {
        details.header = 'Your proposal is in the drafting & discussion phase';
        details.icon = <SquarePenIcon aria-hidden="true" className="size-24 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />;
    }

    return (
        <div className={cn(className, "w-full lg:min-w-[30rem] xl:min-w-[40rem] bg-algo-blue-10 dark:bg-algo-black-90 border-l-8 border-b-[6px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-3xl flex flex-wrap items-center justify-between sm:flex-nowrap relative transition overflow-hidden")}>
            <div className="w-full px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold text-algo-black dark:text-white">{details.header}</h3>
                <p className="mt-1 text-wrap text-sm text-algo-black-80 dark:text-algo-black-30">{details.subHeader}</p>
                <div className="flex flex-col items-center justify-center gap-10 w-full h-96">
                    {details.icon}

                    {
                        proposal.status === ProposalStatus.ProposalStatusVoting
                            ? (
                                <div className="w-full flex flex-col items-center justify-center gap-4">
                                    <VoteCounter />
                                    <div
                                        // style={{ background: `linear-gradient(90deg, #2D2DF1 60%, orange 70%, red 80%)` }} harder to do darkmode version
                                        className="w-full rounded-full h-3 bg-[linear-gradient(90deg,#2D2DF1_60%,orange_70%,red_80%)] dark:bg-[linear-gradient(90deg,#17CAC6_10%,orange_30%,red_40%)]"
                                    ></div>
                                </div>
                            )
                            : null
                    }

                    {details.actionText && (
                        <Link to={details.link} className="mt-2 px-4 py-2 bg-algo-blue dark:bg-algo-teal text-white dark:text-algo-black rounded-md hover:bg-algo-blue-50 dark:hover:bg-algo-teal-50">
                            {details.actionText}
                        </Link>
                    )}

                    {
                        proposal.status === ProposalStatus.ProposalStatusDraft &&
                        proposal.proposer === activeAddress && (
                            <div className="flex gap-4 items-center">
                                <Button
                                    onClick={() => setIsDropModalOpen(true)}
                                    type='button'
                                    variant='ghost'
                                >
                                    Delete
                                </Button>

                                <Button
                                    onClick={() => {
                                        navigate(`/edit/${proposal.id}`);
                                    }}
                                    type='button'
                                    variant='ghost'
                                >
                                    Edit
                                </Button>

                                <InfinityMirrorButton
                                    onClick={() => setIsFinalizeModalOpen(true)}
                                    type='button'
                                    variant='secondary'
                                    disabled={!finalizable}
                                    disabledMessage={finalizable ? undefined : `Discussion is ongoing. ${remainingTime}`}
                                >
                                    Submit
                                </InfinityMirrorButton>

                                <FinalizeModal
                                    isOpen={isFinalizeModalOpen}
                                    onClose={() => setIsFinalizeModalOpen(false)}
                                    proposalId={proposal.id}
                                    activeAddress={activeAddress}
                                    transactionSigner={transactionSigner}
                                    refetchProposal={refetchProposal}
                                />
                                <DropModal
                                    isOpen={isDropModalOpen}
                                    onClose={() => setIsDropModalOpen(false)}
                                    proposalId={proposal.id}
                                    activeAddress={activeAddress}
                                    transactionSigner={transactionSigner}
                                    refetchProposal={refetchProposal}
                                    refetchAllProposals={refetchAllProposals}
                                />
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export interface ProposalInfoProps {
    proposal: ProposalMainCardDetails;
    pastProposals?: ProposalBrief[];
    children: React.ReactNode;
}

export default function ProposalInfo({ proposal, pastProposals, children }: ProposalInfoProps) {

    const phase = ProposalStatusMap[proposal.status];

    return (
        <div className="relative isolate overflow-hidden bg-white dark:bg-algo-black px-6 lg:px-8 py-24 min-h-[calc(100svh-10.625rem)] lg:overflow-visible">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="flex items-center gap-2">
                            Proposal
                            <LoraPillLink id={proposal.id} />
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <svg
                    aria-hidden="true"
                    className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-algo-blue-10 dark:stroke-algo-black-90 [mask-image:radial-gradient(64rem_64rem_at_top,#2D2DF1,transparent)]"
                >
                    <defs>
                        <pattern
                            x="50%"
                            y={-1}
                            id="e813992c-7d03-4cc4-a2bd-151760b470a0"
                            width={200}
                            height={200}
                            patternUnits="userSpaceOnUse"
                            strokeWidth={2}
                        >
                            <path d="M100 200V.5M.5 .5H200" fill="none" />
                        </pattern>
                    </defs>
                    <svg x="50%" y={-1} className="overflow-visible fill-algo-black/5 dark:fill-white/5">
                        <path
                            d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
                            strokeWidth={0}
                        />
                    </svg>
                    <rect fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)" width="100%" height="100%" strokeWidth={0} />
                </svg>
            </div>
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-6 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
                <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 pt-6">
                    <div className="lg:pr-4">
                        <div className="sm:max-w-lg md:max-w-[unset]">
                            <p className="text-base/7 text-algo-blue">
                                <BracketedPhaseDetail phase={phase} />
                            </p>
                            <h1 className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-algo-black dark:text-white sm:text-5xl">
                                {proposal.title}
                            </h1>

                            <p className="mt-6 text-xl/8 text-algo-black-70 dark:text-algo-black-30">
                                {proposal.description}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="-mx-6 lg:flex lg:flex-col lg:items-end lg:fixed lg:right-0 lg:pr-14 lg:pt-14">
                    {children}
                </div>
                <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8">
                    <div className="lg:pr-4">
                        <div className="max-w-xl text-lg/8 text-algo-black-70 dark:text-algo-black-30 sm:max-w-lg md:max-w-[unset]">
                            <p className="mb-8">
                                <strong className="font-semibold text-algo-black dark:text-white">About the team<br /></strong>
                                {proposal.team}
                            </p>
                            <p className="mb-4">
                                <strong className="font-semibold text-algo-black dark:text-white">Additional Info<br /></strong>
                                {proposal.additionalInfo}
                            </p>
                            {
                                !!proposal.adoptionMetrics && (
                                    <div className="mb-4">
                                        <strong className="font-semibold text-algo-black dark:text-white">Adoption Metrics<br /></strong>
                                        <ul className="flex flex-wrap mt-2 gap-4">
                                            {proposal.adoptionMetrics.map((metric, index) => (
                                                <li key={index} className=" bg-algo-blue-10 rounded-md py-1 px-2">
                                                    {metric}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            }

                            <div className="text-base inline-flex items-center justify-between gap-3 mt-2 mb-6 p-1 pr-4">
                                <UserPill
                                    variant='secondary'
                                    address={proposal.proposer}
                                />
                                <span className="text-2xl font-semibold text-algo-blue dark:text-algo-teal">//</span>
                                <span className="text-algo-black-50 dark:text-white">Proposed 2d ago</span>

                            </div>
                            {
                                !!pastProposals && !!pastProposals.length && (
                                    <>
                                        <h5 className="font-semibold text-algo-black dark:text-algo-black-30 mb-2">Past Proposals</h5>
                                        <ul className="text-xl text-algo-black dark:text-white flex flex-col gap-2">
                                            {pastProposals.map((pastProposal) => {
                                                return (
                                                    <li
                                                        key={pastProposal.id}
                                                        className="bg-algo-blue-10 dark:bg-algo-black-90 border-l-4 border-b-[3px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-x-xl rounded-2xl flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-2.5 sm:flex-nowrap relative transition overflow-hidden text-wrap"
                                                    >
                                                        <Link className="absolute left-0 top-0 w-full h-full hover:bg-algo-blue/30 dark:hover:bg-algo-teal/30" to={`/proposal/${Number(pastProposal.id)}`}></Link>
                                                        {pastProposal.title}
                                                        <BracketedPhaseDetail phase={phase} />
                                                    </li>
                                                )
                                            }
                                            )}
                                        </ul>
                                    </>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface FinalizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposalId: bigint;
    activeAddress: string | null;
    transactionSigner: any;
    refetchProposal: () => void;
}

export function FinalizeModal({
    isOpen,
    onClose,
    proposalId,
    activeAddress,
    transactionSigner,
    refetchProposal
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
                refetchProposal();
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

    return (
        <Dialog open={isOpen}>
            <DialogContent
                className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
                onCloseClick={onClose}
            >
                <DialogHeader className="mt-12 flex flex-col items-start gap-2">
                    <DialogTitle className="dark:text-white">Submit Proposal?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to submit this proposal?
                    </DialogDescription>
                </DialogHeader>
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                <DialogFooter className="mt-8">
                    <Button
                        variant='ghost'
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface DropModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposalId: bigint;
    activeAddress: string | null;
    transactionSigner: any;
    refetchProposal: () => void;
    refetchAllProposals: () => void;
}

export function DropModal({
    isOpen,
    onClose,
    proposalId,
    activeAddress,
    transactionSigner,
    refetchProposal,
    refetchAllProposals
}: DropModalProps) {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleDrop = async () => {
        try {
            if (!activeAddress || !transactionSigner) {
                setErrorMessage("Wallet not connected.");
                return false;
            }

            const proposalFactory = new ProposalFactory({ algorand });
            const proposalClient = proposalFactory.getAppClientById({ appId: proposalId });

            const res = await proposalClient.send.drop({
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
                refetchProposal();
                refetchAllProposals();
                navigate('/');
                return true;
            }

            console.log('Transaction not confirmed');
            setErrorMessage("Transaction not confirmed.");
            return false;
        } catch (error) {
            console.error('Error during drop:', error);
            setErrorMessage("An error occurred calling the proposal contract.");
            return false;
        }
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent
                className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
                onCloseClick={onClose}
            >
                <DialogHeader className="mt-12 flex flex-col items-start gap-2">
                    <DialogTitle className="dark:text-white">Delete Proposal?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this proposal? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                <DialogFooter className="mt-8">
                    <Button
                        variant='ghost'
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant='destructive'
                        onClick={handleDrop}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}