import BracketedPhaseDetail from "@/components/BracketedPhaseDetail/BracketedPhaseDetail";
import FocusDetail from "@/components/FocusDetail/FocusDetail";
import FundingTypeDetail from "@/components/FundingTypeDetail/FundingTypeDetail";
import { BlockIcon } from "@/components/icons/BlockIcon";
import { Link } from "react-router-dom";
import LoraPillLink from "@/components/LoraPillLink/LoraPillLink";
import { Page } from "@/components/Page";
import { ProposalCard } from "@/components/ProposalCard/ProposalCard";
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
import { shortenAddress } from "@/functions/shortening";
import { useWallet } from "@txnlab/use-wallet-react";
import { useParams } from "react-router-dom";
import { useProposal, useProposalsByProposer } from "src/hooks/useProposals";
import { useRegistry } from "src/hooks/useRegistry";
import UserPill from "@/components/UserPill/UserPill";
import VoteCounter from "@/components/VoteCounter/VoteCounter";
import { ProposalStatus, ProposalStatusMap, type ProposalBrief, type ProposalInfoCardDetails, type ProposalMainCardDetails } from "@/types/proposals";
import { cn } from "@/functions/utils";
import { ChatBubbleLeftIcon } from "@/components/icons/ChatBubbleLeftIcon";

const title = 'xGov';

export function ProposalPage() {
    const { activeAddress } = useWallet();
    const registryGlobalState = useRegistry();
    // TODO: Get NFD name using the activeAddress
    const { proposal: proposalId } = useParams();
    const proposal = useProposal(Number(proposalId));
    const pastProposals = useProposalsByProposer(proposal.data?.proposer);

    if (proposal.isLoading || registryGlobalState.isLoading) {
        return <div>Loading...</div>
    }

    if (proposal.isError) {
        console.log('error', proposal.error);
        return <div>Error</div>
    }

    if (!proposal.data) {
        return <div>Proposal not found</div>
    }

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
                proposalId={proposalId}
                proposal={proposal.data}
                pastProposals={pastProposals.data}
            >
                <div className="flex lg:flex-col items-end justify-between gap-2 text-white lg:-mt-16 mx-4 lg:mx-0 my-4 p-2">
                    <RequestedAmountDetail requestedAmount={proposal.data.requestedAmount} />
                    <FocusDetail focus={proposal.data.focus} />
                    <FundingTypeDetail fundingType={proposal.data.fundingType} />
                </div>
                <StatusCard proposal={proposal.data} />
            </ProposalInfo>
        </Page >
    )
}

export interface StatusCardProps {
    className?: string;
    proposal: ProposalMainCardDetails;
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
        header: 'This proposal is still a draft',
        subHeader: '',
        icon: '',
        actionText: '',
        link: ''
    },
    [ProposalStatus.ProposalStatusFinal]: {
        header: 'Proposal is still being discussed',
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

export function StatusCard({ className = '', proposal }: StatusCardProps) {

    console.log(proposal.status)

    const details = statusCardMap[proposal.status as keyof typeof statusCardMap];

    return (
        <div className={cn(className, "w-full lg:min-w-[30rem] xl:min-w-[40rem] bg-algo-blue-10 dark:bg-algo-black-90 border-l-8 border-b-[6px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-3xl flex flex-wrap items-center justify-between sm:flex-nowrap relative transition overflow-hidden")}>
            <div className="w-full px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold text-algo-black dark:text-white">{details.header}</h3>
                <p className="mt-1 text-sm text-algo-black-80 dark:text-algo-black-30">{details.subHeader}</p>
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
                </div>
            </div>
        </div>
    )
}

export interface ProposalInfoProps {
    proposalId: string | undefined;
    proposal: ProposalMainCardDetails;
    pastProposals?: ProposalBrief[];
    children: React.ReactNode;
}

export default function ProposalInfo({ proposalId, proposal, pastProposals, children }: ProposalInfoProps) {

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
                            <div className="text-base inline-flex items-center justify-between gap-3 mt-2 mb-6 p-1 pr-4">
                                {/* <div className="w-full text-base inline-flex items-center justify-between gap-4 bg-algo-blue dark:bg-algo-teal-30 my-4 p-1 pr-4 rounded-3xl"> */}

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
                                                        // className="truncate"
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
