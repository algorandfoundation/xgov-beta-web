import pMap from "p-map";
import { useInterval } from "./useInterval";
import { useRegistry } from "./";
import { useEffect } from "react";
import {
  callScrutinize,
  callUnassign,
  getVotingDuration,
  network,
  ProposalStatus,
  type ProposalSummaryCardDetails,
} from "@/api";
import {
  getScrutinyLsig,
  getScrutinyLsigSigner,
} from "@/api/testnet-funding-logicsig";

const SCRUTINIZE_RUN_INTERVAL = 5 * 60 * 1000; // 5 mins
const SCRUTINIZE_CONCURRENCY = 2;

function calculateVoteEnds(
  proposal: ProposalSummaryCardDetails,
) {
  const voteStarted = Number(proposal.voteOpenTs) * 1000;
  const votingDuration = Number(proposal.votingDuration) * 1000
  return voteStarted + votingDuration;
}

export function useProposalScrutinizer(
  proposals: ProposalSummaryCardDetails[],
) {
  const registry = useRegistry();

  const scrutinizeProposal = async (proposal: ProposalSummaryCardDetails) => {
    let actions = 0;
    if (proposal.status === ProposalStatus.ProposalStatusVoting) {
      console.log("Scrutinizing proposal", proposal.id);
      const scrutinyFundingLogicSig = getScrutinyLsig(network);
      const scrutinyFundingLogicSigSigner = getScrutinyLsigSigner(network);
      try {
        await callScrutinize(
          scrutinyFundingLogicSig.address().toString(),
          proposal.id,
          proposal.proposer,
          scrutinyFundingLogicSigSigner,
        );
      } catch (e) {
        console.warn(`Failed to scrutinize proposal ${proposal.id} in voting phase:`, e);
        // proceed anyway since multiple scrutinize calls can be made and the proposal might have been scrutinized by another client
      }
      actions++;
    }
    if (proposal.assignedMembers > 0n) {
      await callUnassign(proposal.id);
      actions++;
    }
    if (actions === 0) {
      console.warn(
        `Proposal ${proposal.id} is not ready for scrutiny but was processed by the scrutinizer. Status: ${proposal.status}, assignedMembers: ${proposal.assignedMembers}`,
      );
    }
  };

  const scheduleScrutinize = (
    proposal: ProposalSummaryCardDetails,
    delay: number,
  ) => {
    console.log(
      "Scheduling scrutinize",
      proposal.id,
      "for",
      delay,
      "ms from now",
    );

    setTimeout(async () => {
      try {
        await scrutinizeProposal(proposal);
      } catch (error) {
        console.error(`Failed to scrutinize proposal ${proposal.id}:`, error);
      }
    }, delay);
  };

  const processProposals = async () => {
    try {
      console.log(
        "Running scrutinize interval for",
        proposals.length,
        "proposals",
      );
      if (network !== "testnet" && network !== "mainnet") return;
      if (!registry?.data?.votingDurationLarge) return;
      console.log("valid to run scrutinize interval");

      const now = Date.now();

      // Find proposals ready for immediate scrutiny
      const toScrutinizeNow = proposals.filter((proposal) => {
        const actionableState =
          proposal.status === ProposalStatus.ProposalStatusVoting ||
          proposal.status === ProposalStatus.ProposalStatusApproved;
        if (!actionableState) return false;

        const allVoted = proposal.votedMembers === proposal.committeeMembers;
        if (allVoted) return true;

        const voteEnds = calculateVoteEnds(proposal);
        const assignedMembers = proposal.assignedMembers || 0n;
        console.log(
          `Proposal ${proposal.id} vote ends at ${new Date(voteEnds).toISOString()}, assigned members: ${assignedMembers}, committee members: ${proposal.committeeMembers}`,
        );
        return voteEnds < now;
      });

      // Process immediate scrutinizations
      if (toScrutinizeNow.length) {
        console.log(
          "Found proposals to scrutinize immediately",
          ...toScrutinizeNow.map(({ id }) => id),
        );

        await pMap(
          toScrutinizeNow,
          (proposal) =>
            scrutinizeProposal(proposal).catch((error) => {
              console.error("Error during immediate proposal scrutiny:", error);
            }),
          { concurrency: SCRUTINIZE_CONCURRENCY },
        );
      } else {
        console.log("No proposals to scrutinize immediately");
      }

      // Schedule future scrutinizations
      for (const proposal of proposals) {
        const isVoting =
          proposal.status === ProposalStatus.ProposalStatusVoting;
        if (!isVoting) continue;

        const allVoted = proposal.votedMembers === proposal.committeeMembers;
        if (allVoted) continue; // already handled above

        const voteEnds = calculateVoteEnds(proposal);

        // Schedule if voting ends before the next interval run
        if (voteEnds > now && voteEnds - now < SCRUTINIZE_RUN_INTERVAL) {
          const delay = voteEnds - now + 6_000; // 6 second buffer
          scheduleScrutinize(proposal, delay);
        }
      }
    } catch (error) {
      console.error("Error in scrutinize interval:", error);
    }
  };

  // Run immediately on mount
  useEffect(() => {
    processProposals();
  }, []);

  // Then run on interval
  useInterval(processProposals, SCRUTINIZE_RUN_INTERVAL);
}
