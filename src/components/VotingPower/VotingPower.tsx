import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { cn } from "@/functions";
import type { CommitteeVotingPower } from "@/api/committee";
import { CopyButton } from "@/components/CopyButton/CopyButton";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface VotingPowerProps {
  committees: CommitteeVotingPower[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

function CommitteeCard({ committee }: { committee: CommitteeVotingPower }) {
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);
  const [copyTooltipText, setCopyTooltipText] = useState("Copy committee ID");
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const percentage =
    committee.totalVotes > 0
      ? ((committee.userVotes / committee.totalVotes) * 100).toFixed(1)
      : "0.0";
  const committeeUrl = `/api/committees/${committee.committeeId}.json`;

  const showCopyTooltip = (message: string) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    setCopyTooltipText(message);
    setCopyTooltipOpen(true);
    tooltipTimeoutRef.current = setTimeout(() => {
      setCopyTooltipOpen(false);
      setCopyTooltipText("Copy committee ID");
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-algo-black p-4">
      <div className="mb-2 flex items-center gap-2">
        <a
          className="min-w-0 flex-1 truncate text-sm font-medium text-algo-blue hover:underline dark:text-algo-teal"
          href={committeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={committee.committeeId}
        >
          Committee {committee.committeeId.slice(0, 8)}...
        </a>
        <div className="relative shrink-0">
          <CopyButton
            value={committee.committeeId}
            variant="outline"
            size="xs"
            className="h-6 p-1 dark:bg-algo-black-80"
            aria-label="Copy committee ID"
            title="Copy committee ID"
            copiedLabel={<CheckIcon className="size-3" />}
            failedLabel={<CopyIcon className="size-3" />}
            onCopied={() => showCopyTooltip("Copied!")}
            onCopyFailed={() => showCopyTooltip("Failed to copy")}
            resetDelay={800}
          >
            <CopyIcon className="size-3" />
          </CopyButton>
          {copyTooltipOpen && (
            <span
              className="absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs text-slate-50 shadow-md dark:bg-slate-50 dark:text-slate-900"
              role="status"
            >
              {copyTooltipText}
            </span>
          )}
        </div>
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
