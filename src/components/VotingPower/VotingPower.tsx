import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { cn } from "@/functions";
import type { CommitteeVotingPower } from "@/api/committee";
import { CopyButton } from "@/components/CopyButton/CopyButton";
import { CheckIcon, CopyIcon } from "lucide-react";

export interface VotingPowerProps {
  committees: CommitteeVotingPower[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

function CommitteeCard({ committee }: { committee: CommitteeVotingPower }) {
  const percentage =
    committee.totalVotes > 0
      ? ((committee.userVotes / committee.totalVotes) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-algo-black p-4">
      <div className="mb-2 flex items-center gap-2">
        <p
          className="min-w-0 flex-1 truncate text-sm font-medium text-algo-blue dark:text-algo-teal"
          title={committee.committeeId}
        >
          Committee {committee.committeeId.slice(0, 8)}...
        </p>
        <CopyButton
          value={committee.committeeId}
          variant="outline"
          size="xs"
          className="h-6 shrink-0 p-1 dark:bg-algo-black-80"
          aria-label="Copy committee ID"
          title="Copy committee ID"
          copiedLabel={<CheckIcon className="size-3" />}
          failedLabel={<CopyIcon className="size-3" />}
          resetDelay={800}
        >
          <CopyIcon className="size-3" />
        </CopyButton>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Your Votes</p>
          <p className="text-lg font-semibold text-algo-black dark:text-white">
            {committee.userVotes.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Votes</p>
          <p className="text-lg font-semibold text-algo-black dark:text-white">
            {committee.totalVotes.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Share</p>
          <p className="text-lg font-semibold text-algo-black dark:text-white">
            {percentage}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Members</p>
          <p className="text-lg font-semibold text-algo-black dark:text-white">
            {committee.memberCount}
          </p>
        </div>
      </div>
    </div>
  );
}

export function VotingPower({
  committees,
  isLoading = false,
  isError = false,
  className = "",
}: VotingPowerProps) {
  return (
    <div className={cn("mb-10", className)}>
      <h2 className="text-lg h-8 mt-0.5 mb-1.5 font-bold">
        Voting Power{" "}
        {committees.length > 0 ? `(${committees.length})` : null}
      </h2>
      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <p className="text-red-600">Error loading voting power information</p>
      ) : committees.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Not a member of any committee
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {committees.map((committee) => (
            <CommitteeCard
              key={committee.committeeId}
              committee={committee}
            />
          ))}
        </div>
      )}
    </div>
  );
}
