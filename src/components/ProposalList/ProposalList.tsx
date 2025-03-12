import { ProposalStatus, ProposalStatusMap, type ProposalSummaryCardDetails } from "@/types/proposals";
import { Link } from "react-router-dom";
import BracketedPhaseDetail from "../BracketedPhaseDetail/BracketedPhaseDetail";
import UserPill from "../UserPill/UserPill";
import RequestedAmountDetail from "../RequestedAmountDetail/RequestedAmountDetail";
import FocusDetail from "../FocusDetail/FocusDetail";
import UserCircleRow from "../UserCircleRow/UserCircleRow";
import VoteCounter from "../VoteCounter/VoteCounter";
import DiscussionLink from "../DiscussionLink/DiscussionLink";
import FundingTypeAndTimeDetail from "../FundingTypeAndTimeDetail/FundingTypeAndTimeDetail";

export interface ProposalListProps {
    proposals: ProposalSummaryCardDetails[];
}

export default function ProposalList({ proposals }: { proposals: ProposalSummaryCardDetails[] }) {
    return (
        <div className="flex flex-col gap-y-4">
            {proposals
                .map(({
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
