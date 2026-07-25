import { useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useWallet } from "@txnlab/use-wallet-react";

import { queryClient } from "@/stores/query.ts";
import type { ProposalSummaryCardDetails } from "@/api";
import { UseWallet, useNFDs } from "@/hooks";
import { proposalListOrder, StackedList } from "@/recipes";

export interface CommitteeProposalsProps {
  // Already narrowed server-side to the proposals carrying this committee id.
  proposals: ProposalSummaryCardDetails[];
}

/**
 * The proposals that carry this committee id — i.e. the decisions this
 * committee's voting power made. Rendered with the same `StackedList` rows as
 * the proposal index, so a proposal reads identically wherever it appears.
 */
export function CommitteeProposals({ proposals }: CommitteeProposalsProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <UseWallet>
        <CommitteeProposalList proposals={proposals} />
      </UseWallet>
    </QueryClientProvider>
  );
}

function CommitteeProposalList({ proposals }: CommitteeProposalsProps) {
  const { activeAddress } = useWallet();

  const proposerAddresses = useMemo(
    () => [...new Set(proposals.map((proposal) => proposal.proposer))],
    [proposals],
  );
  const nfds = useNFDs(proposerAddresses);

  const proposalsWithNFDs = useMemo(
    () =>
      proposals
        .map((proposal) => ({
          ...proposal,
          nfd: nfds.data?.[proposal.proposer],
        }))
        .sort(proposalListOrder),
    [proposals, nfds.data],
  );

  return (
    <StackedList proposals={proposalsWithNFDs} activeAddress={activeAddress} />
  );
}
