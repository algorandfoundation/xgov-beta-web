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

  if (isLoading) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold mb-4">Voting For</h3>
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold mb-4">Voting For</h3>
        <div className="text-red-600">Error loading delegate information</div>
      </div>
    );
  }

  if (!delegates || delegates.length === 0) {
    return (<></>);
  }

  return (
    <div className={cn('mb-10', className)}>
      <h2 className="text-lg h-8 mt-0.5 mb-1.5  font-bold"> Voting For ({delegates.length})</h2>
      <div className="inline-flex gap-2">
        {delegates.map((delegate) => (
          <DelegateItem key={delegate.xgov} xgov={delegate.xgov} />
        ))}
      </div>
    </div>
  );
}
