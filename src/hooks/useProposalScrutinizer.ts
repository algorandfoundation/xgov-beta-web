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
    votingDurations: readonly [bigint, bigint, bigint, bigint],
) {
    const voteStarted = Number(proposal.voteOpenTs) * 1000;
    const votingDuration = getVotingDuration(
        proposal.fundingCategory,
        votingDurations,
    );
    return voteStarted + votingDuration;
}

export function useProposalScrutinizer(proposals: ProposalSummaryCardDetails[]) {
    const registry = useRegistry();

    const scrutinizeProposal = async (proposal: ProposalSummaryCardDetails) => {
        const scrutinyFundingLogicSig = getScrutinyLsig(network);
        const scrutinyFundingLogicSigSigner = getScrutinyLsigSigner(network);
        return Promise.all([
            callScrutinize(
                scrutinyFundingLogicSig.address(),
                proposal.id,
                proposal.proposer,
                scrutinyFundingLogicSigSigner,
            ),
            callUnassign(proposal.id)
        ]);
    };

    const scheduleScrutinize = (proposal: ProposalSummaryCardDetails, delay: number) => {
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
            console.log("Running scrutinize interval");
            if (network !== "testnet" && network !== "mainnet") return;
            if (!registry?.data?.votingDurationLarge) return;
            console.log('valid to run scrutinize interval');

            const votingDurations = [
                registry.data.votingDurationSmall || 0n,
                registry.data.votingDurationMedium || 0n,
                registry.data.votingDurationLarge || 0n,
                registry.data.votingDurationXlarge || 0n,
            ] as const;

            const now = Date.now();

            // Find proposals ready for immediate scrutiny
            const toScrutinizeNow = proposals.filter((proposal) => {
                const isVoting = proposal.status === ProposalStatus.ProposalStatusVoting;
                if (!isVoting) return false;

                const allVoted = proposal.votedMembers === proposal.committeeMembers;
                if (allVoted) return true;

                const voteEnds = calculateVoteEnds(proposal, votingDurations);
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
                    scrutinizeProposal,
                    { concurrency: SCRUTINIZE_CONCURRENCY },
                );
            }

            // Schedule future scrutinizations
            for (const proposal of proposals) {
                const isVoting = proposal.status === ProposalStatus.ProposalStatusVoting;
                if (!isVoting) continue;

                const allVoted = proposal.votedMembers === proposal.committeeMembers;
                if (allVoted) continue; // already handled above

                const voteEnds = calculateVoteEnds(proposal, votingDurations);

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
