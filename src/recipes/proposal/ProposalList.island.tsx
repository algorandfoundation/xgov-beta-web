import { useMemo, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useWallet } from "@txnlab/use-wallet-react";

import { queryClient } from "@/stores/query.ts";
import type { ProposalSummaryCardDetails } from "@/api";
import {
  useGetAllProposals,
  useSearchParams,
  useSearchParamsObserver,
  UseWallet,
} from "@/hooks";

import { proposalFilter, StackedList } from "@/recipes";

export function StackedListIsland({
  proposals,
}: {
  proposals: ProposalSummaryCardDetails[];
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <UseWallet>
        <StackedListQuery proposals={proposals} />
      </UseWallet>
    </QueryClientProvider>
  );
}
export function StackedListQuery({
  proposals,
}: {
  proposals: ProposalSummaryCardDetails[];
}) {
  const proposalsQuery = useGetAllProposals(proposals);

  const [searchParams] = useSearchParams();
  const [_searchParams, setSearchParams] = useState(searchParams);
  useSearchParamsObserver((searchParams) => {
    setSearchParams(searchParams);
  });

  const _proposals = useMemo(
    () =>
      (proposalsQuery.data || []).filter((proposal) =>
        proposalFilter(proposal, _searchParams),
      ),
    [proposals, _searchParams, proposalsQuery],
  );

  const { activeAddress, isReady } = useWallet();

  if (!isReady) {
    return null;
  }

  if (_proposals.length === 0) {
    return (
      <div className="h-80 flex justify-center items-center text-2xl dark:text-algo-teal">
        No Results
      </div>
    );
  }
  return <StackedList activeAddress={activeAddress} proposals={_proposals} />;
}
