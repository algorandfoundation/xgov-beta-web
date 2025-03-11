import { Page } from "../components/Page";
import { filterAmountMap, filters, ProposalFilter } from "@/components/ProposalFilter/ProposalFilter";
import { type ComponentType } from "react";
import { useGetAllProposals } from "src/hooks/useProposals";
import { Link, type LinkProps } from "../components/Link.tsx";
import { FocusReverseMap, ProposalFundingTypeReverseMap, ProposalStatus, ProposalStatusMap, ProposalStatusReverseMap, type ProposalSummaryCardDetails } from "@/types/proposals.ts";
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
import { InfinityMirrorButton } from "@/components/button/InfinityMirrorButton/InfinityMirrorButton.tsx";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";

const title = 'Algorand xGov';
const filterKeys = Object.keys(filters);

const proposalFilter = (proposal: ProposalSummaryCardDetails, searchParams: URLSearchParams): boolean => {
    let passes = true;

    // Exclude proposals with status 0, i.e Empty
    // Happens if a proposer withdraws their proposal
    if (proposal.status === 0) {
        return false;
    }

    filterKeys.forEach((key) => {
        const value = searchParams.get(key) as string;
        if (value) {
            switch (key) {
                case 'status':
                    if (proposal.status !== ProposalStatusReverseMap[value]) {
                        passes = false;
                    }
                    break;
                case 'type':
                    if (proposal.fundingType !== ProposalFundingTypeReverseMap[value]) {
                        passes = false;
                    }
                    break;
                case 'amount':
                    const values = filterAmountMap[value];

                    if (values.length === 1) {
                        if (proposal.requestedAmount < values[0]) {
                            passes = false;
                        }
                    } else if (values.length === 2) {
                        if (proposal.requestedAmount < values[0] || proposal.requestedAmount > values[1]) {
                            passes = false;
                        }
                    }
                    break;
                case 'focus':
                    if (proposal.focus !== FocusReverseMap[value]) {
                        passes = false;
                    }
                    break;
            }
        }
    });
    return passes;
}

export function HomePage() {
    const [searchParams] = useSearchParams();
    const registry = useRegistry();
    const proposalsQuery = useGetAllProposals();

    const proposals = proposalsQuery.data?.filter(
        (proposal) => proposalFilter(proposal, searchParams)
    );

    return (
        <>
            <HeroAnimation />
            <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
                <Hero
                    title={title}
                    description="xGov is a decentralized platform powered by Algorand smart contracts that enables community-driven funding for innovative projects and ideas. Through transparent governance, it empowers the Algorand ecosystem to collectively evaluate and support impactful initiatives."
                    xgovs={4_800}
                    proposals={proposalsQuery.data?.length || 0}
                    treasury={Number(registry.data?.outstandingFunds) || 0}
                    votes={8_329}
                />
                <div className="mt-10">
                    <ProposalListHeader title="Active Proposals">
                        <ProposalFilter />
                        <Link to='/new/proposal'>
                            <InfinityMirrorButton variant='secondary'>
                                New Proposal
                            </InfinityMirrorButton>
                        </Link>
                    </ProposalListHeader>
                    {
                        !!proposals && proposals.length > 0
                            ? <StackedList proposals={proposals} />
                            : <div className="h-80 flex justify-center items-center">No Results</div>
                    }
                </div>
            </Page>
        </>
    )
}

export default function StackedList({ proposals }: { proposals: ProposalSummaryCardDetails[] }) {

    const { activeAddress } = useWallet();
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

                // Filter out blocked proposals
                // They will still be visible in the Admin page
                if (phase == 'Blocked') {
                    return
                }

                return (
                    <div
                        key={id}
                        className="bg-algo-blue-10 dark:bg-algo-black-90 border-l-8 border-b-[6px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-3xl flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-5 sm:flex-nowrap relative transition overflow-hidden"
                    >
                        <Link className="absolute left-0 top-0 w-full h-full hover:bg-algo-blue/30 dark:hover:bg-algo-teal/30" to={`/proposal/${Number(id)}`}></Link>
                        <div>
                            <p className=" text-xl font-semibold text-algo-black dark:text-white">
                                <BracketedPhaseDetail phase={phase} />
                                &nbsp;&nbsp;{title} {(proposer == activeAddress) && ("🫵")}
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
