import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  type ProposalMainCardDetails,
  ProposalStatus,
  councilVote,
} from "@/api";
import { UseWallet } from "@/hooks/useWallet.tsx";
import { UseQuery, useCouncilVotes, useCouncilMembers, useProposal } from "@/hooks";
import { CheckIcon, XIcon, HelpCircleIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import VoteBar from "../VoteBar/VoteBar";
import { TransactionStateLoader } from "../TransactionStateLoader/TransactionStateLoader";
import { useTransactionState } from "@/hooks/useTransactionState";
import { cn } from "@/functions";

export function CouncilCardIsland({
  proposal,
}: {
  proposal: ProposalMainCardDetails;
}) {
  return (
    <UseQuery>
      <UseWallet>
        <ProposalCouncilCard proposalId={proposal.id} status={proposal.status} />
      </UseWallet>
    </UseQuery>
  );
}
export function ProposalCouncilCard({
  proposalId,
  status,
}: {
  proposalId: bigint;
  status: ProposalStatus;
}) {
  const { activeAddress, transactionSigner: innerSigner } = useWallet();
  const proposalQuery = useProposal(proposalId);

  const {
    status: blockStatus,
    setStatus: setBlockStatus,
    errorMessage: blockErrorMessage,
    isPending: blockIsPending
  } = useTransactionState();

  const {
    status: approveStatus,
    setStatus: setApproveStatus,
    errorMessage: approveErrorMessage,
    isPending: approveIsPending
  } = useTransactionState();

  // Always fetch council data to show the status bar
  const councilVotesQuery = useCouncilVotes(Number(proposalId), true);
  const councilMembersQuery = useCouncilMembers();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate council vote counts
  const councilVotes = councilVotesQuery.data || [];
  const totalCouncilMembers = councilMembersQuery.data?.length || 0;
  
  const approvingCouncilMembers = councilVotes.filter(vote => !vote.block).length;
  const approvalsNeededToFund = Math.ceil(totalCouncilMembers / 2) - approvingCouncilMembers;
  const blockingCouncilMembers = councilVotes.filter(vote => vote.block).length;
  const rejectionsNeededToBlock = Math.ceil(totalCouncilMembers / 2) - blockingCouncilMembers;
  const notVotedCouncilMembers = totalCouncilMembers - councilVotes.length;
  

  // Check if current user is a council member and their vote status
  const isCouncilMember = activeAddress && councilMembersQuery.data?.includes(activeAddress);
  const userVote = activeAddress ? councilVotes.find(vote => vote.address === activeAddress) : undefined;

  return (
    <div className="mt-16 max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-algo-black dark:text-white">
          Council Review Status
        </h2>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-algo-black-60 dark:text-white/60 hover:text-algo-black dark:hover:text-white transition-colors">
              <HelpCircleIcon size={20} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Council Review Process</h3>
              <p className="text-algo-black-60 dark:text-white/60">
                This proposal is being reviewed by the xGov Council to ensure it meets the Terms & Conditions.
                Council members can vote to approve or block the proposal before funding is released.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="bg-white dark:bg-algo-black-90 p-4 rounded-lg border dark:border-algo-black-90">
        <div className="flex justify-start gap-2 text-sm text-algo-black-60 dark:text-white/60 mb-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-algo-blue/10 text-algo-blue dark:bg-algo-teal/10 dark:text-algo-teal rounded-full">
            <ArrowUpIcon className="text-algo-blue dark:text-algo-teal" size={16} />
            {approvingCouncilMembers}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-algo-red/10 text-algo-red rounded-full">
            <ArrowDownIcon className="text-algo-red" size={16} />
            {blockingCouncilMembers}
          </div>
        </div>
        <VoteBar
          total={totalCouncilMembers}
          approvals={approvingCouncilMembers}
          rejections={blockingCouncilMembers}
          nulls={notVotedCouncilMembers}
        />
        <div className="mt-2 text-xs text-algo-black-50 dark:text-white/50">
          {councilVotes.length} of {totalCouncilMembers} council members have voted
        </div>
        {councilVotesQuery.isLoading && (
          <div className="text-xs text-algo-black-50 dark:text-white/50 mt-1">
            Loading council votes...
          </div>
        )}

        {status === ProposalStatus.ProposalStatusApproved && (

          userVote ? (
            <div className="mt-4 pt-4 border-t border-algo-black-20 dark:border-white/20">
              <div
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg",
                  userVote.block
                    ? "bg-algo-red/10 dark:bg-algo-red/20"
                    : "bg-algo-green/10 dark:bg-algo-green/20"
                )}
              >
                {userVote.block ? (
                  <>
                    <XIcon className="text-algo-red" size={20} />
                    <span className="text-algo-red font-medium">You voted to Block this proposal</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="text-algo-green" size={20} />
                    <span className="text-algo-green font-medium">You voted to Approve this proposal</span>
                  </>
                )}
              </div>
            </div>
          ) : isCouncilMember ? (
            <div className="mt-4 pt-4 border-t border-algo-black-20 dark:border-white/20">
              <div>
                <h3 className="text-sm font-medium text-algo-black dark:text-white mb-3">
                  Does this proposal conform to the Terms & Conditions?
                </h3>
                <div className="flex gap-2">
                  <Button
                    type='button'
                    onClick={() => councilVote({
                      activeAddress,
                      innerSigner,
                      setStatus: setApproveStatus,
                      refetch: [councilVotesQuery.refetch, proposalQuery.refetch],
                      appId: proposalId,
                      block: false,
                      lastVoter: approvalsNeededToFund === 1,
                      proposerAddress: proposalQuery.data?.proposer!
                    })}
                    disabled={blockIsPending || approveIsPending}
                  >
                    <TransactionStateLoader
                      defaultText="Approve"
                      txnState={{
                        status: approveStatus,
                        errorMessage: approveErrorMessage,
                        isPending: approveIsPending
                      }}
                    />
                  </Button>

                  <Button
                    type='button'
                    variant="destructive"
                    onClick={() => councilVote({
                      activeAddress,
                      innerSigner,
                      setStatus: setBlockStatus,
                      refetch: [councilVotesQuery.refetch, proposalQuery.refetch],
                      appId: proposalId,
                      block: true,
                      lastVoter: rejectionsNeededToBlock === 1,
                      proposerAddress: proposalQuery.data?.proposer!
                    })}
                    disabled={blockIsPending || approveIsPending}
                  >
                    <TransactionStateLoader
                      defaultText="Block"
                      txnState={{
                        status: blockStatus,
                        errorMessage: blockErrorMessage,
                        isPending: blockIsPending
                      }}
                    />
                  </Button>

                </div>
                {errorMessage && (
                  <p className="text-algo-red text-sm mt-2">{errorMessage}</p>
                )}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
