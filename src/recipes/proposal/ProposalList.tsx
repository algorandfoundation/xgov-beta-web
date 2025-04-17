import {
  FocusReverseMap,
  ProposalFundingTypeReverseMap,
  ProposalStatusMap,
  ProposalStatusReverseMap,
  type ProposalSummaryCardDetails,
} from "@/api";
import { BracketedPhaseDetail } from "@/components/BracketedPhaseDetail/BracketedPhaseDetail.tsx";
import { UserPill } from "@/components/UserPill/UserPill.tsx";
import { RequestedAmountDetail } from "@/components/RequestedAmountDetail/RequestedAmountDetail.tsx";
import { FocusDetail } from "@/components/FocusDetail/FocusDetail.tsx";
import { UserCircleRow } from "@/components/UserCircleRow/UserCircleRow.tsx";
import { DiscussionLink } from "@/components/DiscussionLink/DiscussionLink.tsx";
import { FundingTypeAndTimeDetail } from "@/components/FundingTypeAndTimeDetail/FundingTypeAndTimeDetail.tsx";
import {
  filterAmountMap,
  filters,
} from "@/recipes/proposal/list/ProposalFilter.tsx";
import VoteCounter from "@/components/VoteCounter/VoteCounter";
const filterKeys = Object.keys(filters);

export const proposalFilter = (
  proposal: ProposalSummaryCardDetails,
  searchParams: URLSearchParams,
): boolean => {
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
        case "status":
          if (proposal.status !== ProposalStatusReverseMap[value]) {
            passes = false;
          }
          break;
        case "type":
          if (proposal.fundingType !== ProposalFundingTypeReverseMap[value]) {
            passes = false;
          }
          break;
        case "amount":
          const values = filterAmountMap[value];

          if (values.length === 1) {
            if (proposal.requestedAmount < values[0]) {
              passes = false;
            }
          } else if (values.length === 2) {
            if (
              proposal.requestedAmount < values[0] ||
              proposal.requestedAmount > values[1]
            ) {
              passes = false;
            }
          }
          break;
        case "focus":
          if (proposal.focus !== FocusReverseMap[value]) {
            passes = false;
          }
          break;
      }
    }
  });
  return passes;
};

export function StackedList({
  proposals,
  activeAddress,
}: {
  proposals: ProposalSummaryCardDetails[];
  activeAddress: string | null;
}) {
  return (
    <div className="flex flex-col gap-y-4">
      {proposals.map((proposal) => {
        const {
          id,
          title,
          status,
          focus,
          fundingType,
          requestedAmount,
          proposer,
          approvals,
          rejections
        } = proposal;

        const phase = ProposalStatusMap[status];

        // Filter out blocked proposals
        // They will still be visible in the Admin page
        if (phase == "Blocked") {
          return;
        }

        return (
          <div
            key={id}
            className="bg-algo-blue-10 dark:bg-algo-black-90 border-l-8 border-b-[6px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-3xl flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-5 sm:flex-nowrap relative transition overflow-hidden"
          >
            <a
              className="absolute left-0 top-0 w-full h-full hover:bg-algo-blue/30 dark:hover:bg-algo-teal/30"
              href={`/proposal/${Number(id)}`}
            ></a>
            <div>
              <p className=" text-xl font-semibold text-algo-black dark:text-white">
                <BracketedPhaseDetail phase={phase} />
                &nbsp;&nbsp;{title} {proposer == activeAddress && "🫵"}
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
                  {phase === "Voting" && (
                    <>
                      <UserCircleRow />
                      <VoteCounter
                        approvals={Number(approvals)}
                        rejections={Number(rejections)}
                      />
                    </>
                  )}

                  {phase === "Discussion" && (
                    <>
                      <UserCircleRow />
                      <DiscussionLink to={`https://forum.algorand.org/`} />
                    </>
                  )}
                </div>
                <FundingTypeAndTimeDetail
                  fundingType={fundingType}
                  time="2d ago"
                />
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}
