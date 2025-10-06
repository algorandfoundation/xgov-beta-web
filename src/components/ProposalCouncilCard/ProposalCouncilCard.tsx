import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  RegistryAppID,
  getProposalClientById,
  type ProposalMainCardDetails,
  ProposalStatus,
  callUnassign,
} from "@/api";
import { ALGORAND_MIN_TX_FEE } from "algosdk";
import { UseWallet } from "@/hooks/useWallet.tsx";
import { useProposal, UseQuery, useCouncilVotes, useCouncilMembers } from "@/hooks";
import { CheckIcon, XIcon, HelpCircleIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import VoteBar from "../VoteBar/VoteBar";

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
  const { activeAddress, transactionSigner } = useWallet();
  const proposalQuery = useProposal(proposalId);

  // Always fetch council data to show the status bar
  const councilVotesQuery = useCouncilVotes(Number(proposalId), true);
  const councilMembersQuery = useCouncilMembers();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate council vote counts
  const councilVotes = councilVotesQuery.data || [];
  const totalCouncilMembers = councilMembersQuery.data?.length || 0;
  const approvingCouncilMembers = councilVotes.filter(vote => !vote.block).length;
  const blockingCouncilMembers = councilVotes.filter(vote => vote.block).length;
  const notVotedCouncilMembers = totalCouncilMembers - councilVotes.length;

  // Check if current user is a council member and their vote status
  const isCouncilMember = activeAddress && councilMembersQuery.data?.includes(activeAddress);
  const userVote = activeAddress ? councilVotes.find(vote => vote.address === activeAddress) : undefined;

  const handleReviewBlock = async (bool: boolean) => {
    const proposalClient = getProposalClientById(proposalId);

    if (!activeAddress || !proposalClient) {
      setErrorMessage(
        "Failed to get proposal client or active address is missing.",
      );
      return false;
    }

    try {
      const res = await proposalClient.send.review({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          block: bool,
        },
        appReferences: [RegistryAppID],
        extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
      });

      if (
        res.confirmation.confirmedRound !== undefined &&
        res.confirmation.confirmedRound > 0 &&
        res.confirmation.poolError === ""
      ) {
        console.log("Transaction confirmed");
        // call backend to unassign voters
        try {
          await callUnassign(proposalId);
        } catch (e) {
          console.warn("Failed to Unassign:", e);

        }
        setErrorMessage(null);
        proposalQuery.refetch();
        councilVotesQuery.refetch(); // Refresh council votes
        return true;
      }

      console.log("Transaction not confirmed");
      setErrorMessage("Transaction not confirmed.");
      return false;
    } catch (error) {
      console.error("Error during review:", error);
      setErrorMessage("An error occurred calling the proposal contract.");
      return false;
    }
  };

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
      <div className="bg-white dark:bg-algo-black-90 p-4 rounded-lg border">
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

        {/* Council voting actions */}
        {status === ProposalStatus.ProposalStatusApproved && (
          <div className="mt-4 pt-4 border-t border-algo-black-20 dark:border-white/20">
            {userVote ? (
              <div className="flex items-center gap-2 p-3 bg-algo-black-10 dark:bg-algo-black-80 rounded-lg">
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
            ) : isCouncilMember ? (
              <div>
                <h3 className="text-sm font-medium text-algo-black dark:text-white mb-3">
                  Does this proposal conform to the Terms & Conditions?
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReviewBlock(false)}
                    size="sm"
                    className="flex-1 bg-algo-blue dark:bg-algo-teal hover:bg-algo-blue/90 text-white border-0"
                  >
                    <CheckIcon size={16} className="mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReviewBlock(true)}
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    <XIcon size={16} className="mr-1" />
                    Block
                  </Button>
                </div>
                {errorMessage && (
                  <p className="text-algo-red text-sm mt-2">{errorMessage}</p>
                )}
              </div>
            ) : (
              <div className="text-center p-3 bg-algo-black-10 dark:bg-algo-black-80 rounded-lg">
                <p className="text-sm text-algo-black-60 dark:text-white/60">
                  Only council members can vote on reviews
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
