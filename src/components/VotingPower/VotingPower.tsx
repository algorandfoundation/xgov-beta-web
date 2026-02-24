import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { cn } from "@/functions";
import type { CommitteeVotingPower } from "@/api/committee";

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
      <p className="text-sm font-medium text-algo-blue dark:text-algo-teal mb-2 truncate" title={committee.committeeId}>
        Committee {committee.committeeId.slice(0, 8)}...
      </p>
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
