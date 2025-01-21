import BracketedPhaseDetail from "@/components/BracketedPhaseDetail/BracketedPhaseDetail";
import DiscussionLink from "@/components/DiscussionLink/DiscussionLink";
import FocusDetail from "@/components/FocusDetail/FocusDetail";
import FundingTypeAndTimeDetail from "@/components/FundingTypeAndTimeDetail/FundingTypeAndTimeDetail";
import FundingTypeDetail from "@/components/FundingTypeDetail/FundingTypeDetail";
import { BlockIcon } from "@/components/icons/BlockIcon";
import { Link } from "@/components/Link";
import LoraPillLink from "@/components/LoraPillLink/LoraPillLink";
import { Page } from "@/components/Page";
import { ProposalCard } from "@/components/ProposalCard/ProposalCard";
import RequestedAmountDetail from "@/components/RequestedAmountDetail/RequestedAmountDetail";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import UserCircleRow from "@/components/UserCircleRow/UserCircleRow";
import UserPill from "@/components/UserPill/UserPill";
import VoteCounter from "@/components/VoteCounter/VoteCounter";
import { ProposalFundingTypeMap, statusToPhase, type ProposalBrief, type ProposalInfoCardDetails, type ProposalMainCardDetails } from "@/types/proposals";
import { useParams } from "react-router-dom";
import { useProposal, useProposalBrief } from "src/hooks/useProposals";

const title = 'xGov';

export function ProposalPage() {
    // const { activeAddress } = useWallet();
    // TODO: Get NFD name using the activeAddress
    const { proposal: proposalId } = useParams();
    // const proposalId = Number(proposalIdParam);
    const proposal = useProposal(Number(proposalId));
    const pastProposals = useProposalBrief(proposal.data?.pastProposalLinks);

    if (proposal.isLoading) {
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
        <Page title={title}>
            <ProposalInfo
                proposalId={proposalId}
                proposal={proposal.data}
                pastProposals={pastProposals.data}
            >
                <div className="flex items-center justify-between gap-10 bg-algo-blue text-white dark:bg-algo-teal-30 my-4 px-2 pr-4 p-1 rounded-3xl">
                    <RequestedAmountDetail variant='secondary' requestedAmount={proposal.data.requestedAmount} />
                    <FocusDetail variant='secondary' focus={proposal.data.focus} />
                    <FundingTypeDetail variant='secondary' fundingType={proposal.data.fundingType} />
                </div>
                <VotingCard proposal={proposal.data} />
            </ProposalInfo>
        </Page >
    )
}

export interface VotingCardProps {
    proposal: ProposalMainCardDetails;
}

export function VotingCard({ proposal }: VotingCardProps) {
    return (
        <div className="w-full min-w-[40rem] bg-algo-blue-10 dark:bg-algo-black-90 border-l-8 border-b-[6px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-3xl flex flex-wrap items-center justify-between sm:flex-nowrap relative transition overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold text-algo-black dark:text-white">Vote on this proposal</h3>
                <p className="mt-1 text-sm text-algo-black-80 dark:text-algo-black-30">
                    Vote on this proposal to help fund it.
                </p>
                <div className="flex flex-col items-center justify-center w-full h-40">
                    <BlockIcon className="size-10 stroke-algo-blue" />
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

    const phase = statusToPhase[proposal.status];

    return (
        <div className="relative isolate overflow-hidden bg-white dark:bg-algo-black px-6 lg:px-8 py-24 min-h-[calc(100svh-10.625rem)] lg:overflow-visible">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Proposal</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{Number(proposalId)}</BreadcrumbPage>
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
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
                <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 pt-6">
                    <div className="lg:pr-4">
                        <div className="sm:max-w-lg md:max-w-[unset]">
                            <p className="text-base/7 font-semibold text-algo-blue">
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
                <div className="lg:flex lg:flex-col lg:items-end lg:fixed lg:right-0 pr-14 pt-14">
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
                            <div className="w-full text-base inline-flex items-center justify-between gap-4 bg-algo-blue dark:bg-algo-teal-30 my-4 p-1 pr-4 rounded-3xl">
                                <UserPill
                                    variant='secondary'
                                    address='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
                                />
                                <span className="text-white dark:text-algo-black">Proposed 2d ago</span>
                            </div>
                            {
                                !!pastProposals && !!pastProposals.length && (
                                    <>
                                        <strong className="font-semibold text-algo-black dark:text-white">Past Proposals<br /></strong>
                                        <ul className="text-xl dark:text-algo-blue-10 flex flex-col gap-2">
                                            {pastProposals.map((pastProposal) => {
                                                return (
                                                    <li key={pastProposal.id} className="truncate">
                                                        <Link
                                                            className="hover:text-algo-teal dark:hover:text-algo-blue"
                                                            to={'/proposal/' + pastProposal.id}
                                                        >

                                                            {pastProposal.title}
                                                        </Link>
                                                    </li>
                                                )}
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
