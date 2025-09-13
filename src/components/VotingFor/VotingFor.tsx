import { useNFD } from "@/hooks";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { UserPill } from "@/components/UserPill/UserPill";
import { cn } from "@/functions";
import type { XGovBoxValue } from "@algorandfoundation/xgov/registry";

export interface VotingForProps {
  delegates: (XGovBoxValue & { xgov: string })[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

function DelegateItem({ xgov }: { xgov: string }) {
  const nfd = useNFD(xgov);

  return (
    <UserPill
      variant={'secondary'}
      address={xgov}
      nfdName={nfd.data?.name}
    />
  );
}

export function VotingFor({
  delegates,
  isLoading = false,
  isError = false,
  className = ""
}: VotingForProps) {
  return (
    <div className={cn('mb-10', className)}>
      <h2 className="text-lg h-8 mt-0.5 mb-1.5 font-bold"> Voting For {delegates.length > 0 ? `(${delegates.length})` : null}</h2>
      {
        isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <p className="text-red-600">Error loading delegate information</p>
        ) : delegates.length === 0 ? (
          <p>No delegates found</p>
        ) : <div className="inline-flex gap-2">
          {delegates.map((delegate) => (
            <DelegateItem key={delegate.xgov} xgov={delegate.xgov} />
          ))}
        </div>
      }
    </div>
  );
}
