import { BracketedPhaseDetail } from "@/components/BracketedPhaseDetail/BracketedPhaseDetail";
import { VoteCounter } from "@/components/VoteCounter/VoteCounter";
import VoteBar from "@/components/VoteBar/VoteBar";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { type VoteHistoryEntry, getExplorerTxnUrl } from "@/api/voting-history";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Ban } from "lucide-react";

export function VotingHistory({
  votes,
  isLoading,
  isError,
}: {
  votes?: VoteHistoryEntry[];
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-algo-black dark:text-white mb-4">
          Voting History
        </h2>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-algo-black dark:text-white mb-4">
          Voting History
        </h2>
        <p className="text-algo-black-60 dark:text-white/60">
          Failed to load voting history.
        </p>
      </div>
    );
  }

  if (!votes || votes.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-algo-black dark:text-white mb-4">
        Voting History
      </h2>
      <div className="flex flex-col gap-y-4">
        {votes.map((vote) => (
          <VotingHistoryItem
            key={vote.txnId || `missed-${vote.proposalId}`}
            vote={vote}
          />
        ))}
      </div>
    </div>
  );
}

function VotingHistoryItem({ vote }: { vote: VoteHistoryEntry }) {
  return (
    <div className="w-full bg-algo-blue-10 dark:bg-algo-black-90 rounded-3xl flex flex-col gap-y-4 p-5 relative transition overflow-hidden">
      <a
        className="absolute left-0 top-0 w-full h-full hover:bg-algo-blue/30 dark:hover:bg-algo-teal/30"
        href={`/proposal/${Number(vote.proposalId)}`}
      />
      <div className="flex justify-between items-center">
        <p className="text-xl font-semibold text-algo-black dark:text-white">
          <BracketedPhaseDetail phase={vote.proposalStatus} />
          &nbsp;&nbsp;{vote.proposalTitle}
        </p>
      </div>

      {vote.missed ? (
        <div className="flex items-center gap-2 text-algo-red font-semibold">
          <Ban className="size-5" />
          <span>Missed Vote</span>
          <span className="text-sm font-normal text-algo-black-60 dark:text-white/60">
            ({vote.totalVotes.toLocaleString()} votes unused)
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <VoteCounter
            approvals={vote.approvalVotes}
            rejections={vote.rejectionVotes}
            nulls={vote.nullVotes}
          />
          <VoteBar
            approvals={vote.approvalVotes}
            rejections={vote.rejectionVotes}
            nulls={vote.nullVotes}
            total={vote.totalVotes}
          />
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-algo-black-60 dark:text-white/60 font-mono">
        <span>
          {vote.timestamp > 0
            ? formatDistanceToNow(new Date(vote.timestamp * 1000), {
                addSuffix: true,
              })
            : "Unknown time"}
        </span>
        {vote.txnId && (
          <a
            href={getExplorerTxnUrl(vote.txnId)}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 flex items-center gap-1 hover:text-algo-blue dark:hover:text-algo-teal transition-colors"
          >
            View transaction
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}
