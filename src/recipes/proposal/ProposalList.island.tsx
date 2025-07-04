import { useMemo, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useWallet } from "@txnlab/use-wallet-react";

import { queryClient } from "@/stores/query.ts";
import {
  callScrutinize,
  callUnassign,
  getVotingDuration,
  network,
  ProposalStatus,
  type ProposalSummaryCardDetails,
} from "@/api";
import {
  useGetAllProposals,
  useNFDs,
  useRegistry,
  useSearchParams,
  useSearchParamsObserver,
  UseWallet,
} from "@/hooks";
import { proposalFilter, StackedList } from "@/recipes";
import pMap from "p-map";
import {
  scrutinyFundingLogicSig,
  scrutinyFundingLogicSigSigner,
} from "@/api/testnet-funding-logicsig";
import { useInterval } from "@/hooks/useInterval";

const SCRUTINIZE_RUN_INTERVAL = 5 * 60 * 1000; // 5 mins
const SCRUTINIZE_CONCURRENCY = 2;

function calculateVoteEnds(
  proposal: ProposalSummaryCardDetails,
  votingDurations: readonly [bigint, bigint, bigint, bigint],
) {
  const voteStarted = Number(proposal.voteOpenTs) * 1000;
  const votingDuration = getVotingDuration(
    proposal.fundingCategory,
    votingDurations,
  );
  return voteStarted + votingDuration;
}

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
  const registry = useRegistry();
  const proposalsQuery = useGetAllProposals(proposals);
  const nfds = useNFDs(
    proposalsQuery.data?.map((proposal) => proposal.proposer) || []
  )

  const [searchParams] = useSearchParams();
  const [_searchParams, setSearchParams] = useState(searchParams);
  useSearchParamsObserver((searchParams) => {
    setSearchParams(searchParams);
  });

  // Merge NFD data with proposals before applying filters
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

  useInterval(() => {
    // TODO move this to a better place
    (async () => {
      if (network !== "testnet") return;
      if (!registry?.data?.votingDurationXlarge) return;

      const votingDurations = [
        registry.data.votingDurationSmall || 0n,
        registry.data.votingDurationMedium || 0n,
        registry.data.votingDurationLarge || 0n,
        registry.data.votingDurationXlarge || 0n,
      ] as const;

      const now = Date.now();

      // find proposals ready for scrutiny
      const toScrutinizeNow = proposals.filter((proposal) => {
        const isVoting =
          proposal.status === ProposalStatus.ProposalStatusVoting;
        if (!isVoting) return false;
        const allVoted = proposal.votedMembers === proposal.committeeMembers;
        if (allVoted) return true;
        const voteEnds = calculateVoteEnds(proposal, votingDurations);
        if (voteEnds < now) return true;
      });

      if (toScrutinizeNow.length) {
        console.log(
          "Found proposals to scrutinize immediately",
          ...toScrutinizeNow.map(({ id }) => id),
        );

        await pMap(
          toScrutinizeNow,
          (proposal) =>
          {
            callScrutinize(
              scrutinyFundingLogicSig.address(),
              proposal.id,
              proposal.proposer,
              scrutinyFundingLogicSigSigner,
            )
            // call backend to unassign voters
            callUnassign(proposal.id);
          },
          { concurrency: SCRUTINIZE_CONCURRENCY },
        );
      }

      // find proposals ending before the next interval run, schedule them
      for (const proposal of proposals) {
        const isVoting =
          proposal.status === ProposalStatus.ProposalStatusVoting;
        if (!isVoting) continue;

        const allVoted = proposal.votedMembers === proposal.committeeMembers;
        if (allVoted) continue; // handled up

        const voteEnds = calculateVoteEnds(proposal, votingDurations);
        // ends before the next Interval run
        if (voteEnds > now && voteEnds - now < SCRUTINIZE_RUN_INTERVAL) {
          const wen = voteEnds - now + 6_000;
          console.log(
            "Scheduling scrutinize",
            proposal.id,
            "for",
            wen,
            "ms from now",
          );
          setTimeout(() => {
            callScrutinize(
              scrutinyFundingLogicSig.address(),
              proposal.id,
              proposal.proposer,
              scrutinyFundingLogicSigSigner,
            );
            // call backend to unassign voters
            callUnassign(proposal.id);
          }, wen);
        }
      }
    })();
  }, SCRUTINIZE_RUN_INTERVAL);

  return <StackedList activeAddress={activeAddress} proposals={_proposals} />;
}
