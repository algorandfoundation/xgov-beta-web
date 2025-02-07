import { Page } from "../components/Page.tsx";
import { ProposalFilter } from "@/components/ProposalFilter/ProposalFilter.tsx";
import { Link } from "react-router-dom";
import { type ComponentType } from "react";
import type { LinkProps } from "../components/Link.tsx";
import { useGetAllProposals } from "src/hooks/useProposals.ts";
import { ProposalStatusMap, type ProposalSummaryCardDetails } from "@/types/proposals.ts";
import { Hero } from "@/components/Hero/Hero.tsx";
import HeroAnimation from "@/components/HeroAnimation/HeroAnimation.tsx";
import UserPill from "@/components/UserPill/UserPill.tsx";
import RequestedAmountDetail from "@/components/RequestedAmountDetail/RequestedAmountDetail.tsx";
import FocusDetail from "@/components/FocusDetail/FocusDetail.tsx";
import UserCircleRow from "@/components/UserCircleRow/UserCircleRow.tsx";
import DiscussionLink from "@/components/DiscussionLink/DiscussionLink.tsx";
import FundingTypeAndTimeDetail from "@/components/FundingTypeAndTimeDetail/FundingTypeAndTimeDetail.tsx";
import BracketedPhaseDetail from "@/components/BracketedPhaseDetail/BracketedPhaseDetail.tsx";
import VoteCounter from "@/components/VoteCounter/VoteCounter.tsx";
import ProposalListHeader from "@/components/ProposalListHeader/ProposalListHeader.tsx";
import { useRegistry } from "src/hooks/useRegistry.ts";

const title = 'Algorand xGov';

export function HomePage() {
    // const cohort = useGetCohort();
    const registry = useRegistry();
    const proposals = useGetAllProposals();

    return (
        <>
            <HeroAnimation />
            <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
                <Hero
                    title={title}
                    description="xGov is a decentralized platform powered by Algorand smart contracts that enables community-driven funding for innovative projects and ideas. Through transparent governance, it empowers the Algorand ecosystem to collectively evaluate and support impactful initiatives."
                    xgovs={4_800}
                    proposals={proposals.data?.length || 0}
                    treasury={Number(registry.data?.outstandingFunds) || 0}
                    votes={8_329}
                />
                <div className="mt-10">
                    <ProposalListHeader title="Active Proposals">
                        <ProposalFilter />
                        <Link
                            to='/new/proposal'
                            className="block rounded-md bg-algo-blue dark:bg-algo-teal px-1.5 sm:px-3 py-2 text-center text-xs sm:text-sm font-semibold text-white dark:text-algo-black shadow-sm hover:bg-algo-blue-50 dark:hover:bg-algo-teal-50"
                        >
                            New Proposal
                        </Link>
                    </ProposalListHeader>
                    {
                        !!proposals.data
                            ? <StackedList proposals={proposals.data} />
                            : <div className="h-[96rem]"></div>
                    }
                </div>
            </Page>
        </>
    )
}

export default function StackedList({ proposals }: { proposals: ProposalSummaryCardDetails[] }) {
    return (
        <div className="flex flex-col gap-y-4">
            {proposals.map(({
                id,
                title,
                status,
                focus,
                fundingType,
                requestedAmount,
                proposer
            }) => {

                const phase = ProposalStatusMap[status];

                return (
                    <div
                        key={id}
                        className="bg-algo-blue-10 dark:bg-algo-black-90 border-l-8 border-b-[6px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-3xl flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-5 sm:flex-nowrap relative transition overflow-hidden"
                    >
                        <Link className="absolute left-0 top-0 w-full h-full hover:bg-algo-blue/30 dark:hover:bg-algo-teal/30" to={`/proposal/${Number(id)}`}></Link>
                        <div>
                            <p className=" text-xl font-semibold text-algo-black dark:text-white">
                                <BracketedPhaseDetail phase={phase} />
                                &nbsp;&nbsp;{title}
                            </p>
                            <div className="mt-3 hidden md:flex md:items-center gap-4 md:gap-10 text-algo-blue dark:text-algo-teal font-mono">
                                <UserPill address={proposer} />
                                <RequestedAmountDetail requestedAmount={requestedAmount} />
                                <FocusDetail focus={focus} />
                            </div>
                        </div>
                        <dl className="flex w-full flex-none justify-between md:gap-x-8 sm:w-auto font-mono">
                            <div className="mt-3 flex md:hidden flex-col items-start justify-start gap-4 md:gap-10 text-algo-blue dark:text-algo-teal font-mono text-xs">
                                <UserPill address={proposer} />
                                <RequestedAmountDetail requestedAmount={requestedAmount} />
                                <FocusDetail focus={focus} />
                            </div>
                            <div className="flex flex-col justify-end items-end gap-4">
                                <div className="flex items-end gap-4">
                                    {
                                        phase === 'Voting' && (
                                            <>
                                                <UserCircleRow />
                                                <VoteCounter />
                                            </>
                                        )
                                    }

                                    {
                                        phase === 'Discussion' && (
                                            <>
                                                <UserCircleRow />
                                                <DiscussionLink to={`https://forum.algorand.org/`} />
                                            </>
                                        )
                                    }
                                </div>
                                <FundingTypeAndTimeDetail fundingType={fundingType} time='2d ago' />
                            </div>
                        </dl>
                    </div>
                )
            })}
        </div>
    )
}
