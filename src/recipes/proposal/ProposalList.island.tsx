import { useMemo, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useWallet } from "@txnlab/use-wallet-react";

import { queryClient } from "@/stores/query.ts";
import { type ProposalSummaryCardDetails } from "@/api";
import {
  useGetAllProposals,
  useNFDs,
  useScrutinizerUnassigner,
  useSearchParams,
  useSearchParamsObserver,
  UseWallet,
} from "@/hooks";
import { proposalFilter, StackedList } from "@/recipes";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";

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
  const nfds = useNFDs(
    proposalsQuery.data?.map((proposal) => proposal.proposer) || []
  )

  const [searchParams] = useSearchParams();
  const [_searchParams, setSearchParams] = useState(searchParams);
  useSearchParamsObserver((searchParams) => {
    setSearchParams(searchParams);
  });

  const proposalsWithNFDs = useMemo(() => {
    if (!proposalsQuery.data) return [];

    return proposalsQuery.data.map((proposal) => ({
      ...proposal,
      nfd: nfds.data?.[proposal.proposer]
    }));
  }, [proposalsQuery.data, nfds.data]);

  const _proposals = useMemo(
    () =>
      proposalsWithNFDs.filter((proposal) =>
        proposalFilter(proposal, _searchParams),
      ),
    [proposalsWithNFDs, _searchParams],
  );

  const { activeAddress, isReady } = useWallet();

  // Use the custom hook for proposal scrutinization
  useScrutinizerUnassigner(proposalsQuery.data || []);

  if (!isReady) {
    return (
      <div className="h-80 flex justify-center items-center text-2xl dark:text-algo-teal">
        <LoadingSpinner />
      </div>
    );
  }

  if (_proposals.length === 0) {
    return (
      <div className="h-80 flex justify-center items-center text-2xl dark:text-algo-teal">
        No Proposals
      </div>
    );
  }

  return <StackedList activeAddress={activeAddress} proposals={_proposals} />;
}
