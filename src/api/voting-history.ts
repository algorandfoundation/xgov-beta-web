import algosdk from "algosdk";
import { indexer, network } from "@/api/algorand/algo-client";
import { getXGovCommitteeMap } from "@/api/committee";
import { getAllProposals } from "@/api/proposals";
import {
  type ProposalSummaryCardDetails,
  ProposalStatus,
  ProposalStatusMap,
} from "@/api/types";

export interface VoteHistoryEntry {
  proposalId: bigint;
  proposalTitle: string;
  proposalStatus: string;
  approvalVotes: number;
  rejectionVotes: number;
  nullVotes: number;
  totalVotes: number;
  timestamp: number;
  txnId: string;
  missed: boolean;
}

interface ProposalVote {
  txnId: string;
}

// ARC-28 selector for:
// Vote(address,uint32,uint32,uint32,bool,uint32,uint32,uint32,uint32,uint32)
const VOTE_EVENT_SELECTOR = new Uint8Array([0x5e, 0xf0, 0xd3, 0xf1]);
// The first mainnet proposal used the original, shorter Vote event schema.
const LEGACY_VOTE_EVENT_SELECTOR = new Uint8Array([0x15, 0x77, 0xf6, 0xe7]);
const VOTE_EVENT_SELECTORS = [VOTE_EVENT_SELECTOR, LEGACY_VOTE_EVENT_SELECTOR];

function selectorMatches(log: Uint8Array, selector: Uint8Array): boolean {
  return (
    log.length >= selector.length + 32 &&
    selector.every((byte, index) => log[index] === byte)
  );
}

function decodeVoteEvent(
  log: Uint8Array,
  xgovAddress: string,
  txnId: string,
): ProposalVote | undefined {
  if (
    !VOTE_EVENT_SELECTORS.some((selector) => selectorMatches(log, selector))
  ) {
    return undefined;
  }

  const address = algosdk.encodeAddress(log.slice(4, 36));
  if (address !== xgovAddress) return undefined;

  return { txnId };
}

async function findProposalVote(
  proposalId: bigint,
  xgovAddress: string,
): Promise<ProposalVote | undefined> {
  let nextToken: string | undefined;
  const seenTokens = new Set<string>();

  do {
    let query = indexer.lookupApplicationLogs(proposalId).limit(1000);
    if (nextToken) query = query.nextToken(nextToken);

    const response = await query.do();
    for (const logData of response.logData ?? []) {
      for (const log of logData.logs) {
        const vote = decodeVoteEvent(log, xgovAddress, logData.txid);
        if (vote) return vote;
      }
    }

    if (!response.nextToken || seenTokens.has(response.nextToken)) break;
    seenTokens.add(response.nextToken);
    nextToken = response.nextToken;
  } while (nextToken);

  return undefined;
}

function proposalTitle(proposal: ProposalSummaryCardDetails): string {
  return proposal.title || `Proposal ${proposal.id}`;
}

function proposalStatus(proposal: ProposalSummaryCardDetails): string {
  return ProposalStatusMap[proposal.status] ?? "Unknown";
}

export async function getVotingHistory(
  xgovAddress: string,
): Promise<VoteHistoryEntry[]> {
  const proposals = await getAllProposals();

  // Committee files are the index from an xGov to its relevant proposals. Load
  // each committee once, then query logs only for proposals assigned to this
  // xGov instead of scanning the registry's complete transaction history.
  const committeeIds = new Map<string, Uint8Array>();
  for (const proposal of proposals) {
    if (!proposal.committeeId || proposal.committeeId.length === 0) continue;
    committeeIds.set(
      Buffer.from(proposal.committeeId).toString("base64"),
      proposal.committeeId,
    );
  }

  const committeeEntries = await Promise.all(
    [...committeeIds].map(async ([key, committeeId]) => {
      try {
        return [
          key,
          await getXGovCommitteeMap(Buffer.from(committeeId)),
        ] as const;
      } catch {
        return [key, undefined] as const;
      }
    }),
  );
  const committeeCache = new Map(committeeEntries);

  const relevantProposals = proposals.flatMap((proposal) => {
    if (!proposal.committeeId || proposal.committeeId.length === 0) return [];

    const committeeKey = Buffer.from(proposal.committeeId).toString("base64");
    const votingPower = committeeCache.get(committeeKey)?.get(xgovAddress);
    return votingPower === undefined ? [] : [{ proposal, votingPower }];
  });

  const proposalVotes = await Promise.all(
    relevantProposals.map(async ({ proposal, votingPower }) => ({
      proposal,
      votingPower,
      vote: await findProposalVote(proposal.id, xgovAddress),
    })),
  );

  const voteDetails = new Map<
    string,
    {
      approvalVotes: number;
      rejectionVotes: number;
      timestamp: number;
    }
  >();
  await Promise.all(
    proposalVotes.flatMap(({ vote }) =>
      vote
        ? [
            indexer
              .lookupTransactionByID(vote.txnId)
              .do()
              .then(({ transaction }) => {
                const args =
                  transaction.applicationTransaction?.applicationArgs;
                if (!args || args.length < 5) {
                  throw new Error(`Invalid vote transaction ${vote.txnId}`);
                }

                voteDetails.set(vote.txnId, {
                  approvalVotes: Number(
                    algosdk.ABIType.from("uint64").decode(args[3]) as bigint,
                  ),
                  rejectionVotes: Number(
                    algosdk.ABIType.from("uint64").decode(args[4]) as bigint,
                  ),
                  timestamp: Number(transaction.roundTime ?? 0),
                });
              }),
          ]
        : [],
    ),
  );

  const pastVotingStatuses = new Set([
    ProposalStatus.ProposalStatusApproved,
    ProposalStatus.ProposalStatusRejected,
    ProposalStatus.ProposalStatusReviewed,
    ProposalStatus.ProposalStatusFunded,
    ProposalStatus.ProposalStatusBlocked,
  ]);

  const entries: VoteHistoryEntry[] = [];
  for (const { proposal, votingPower, vote } of proposalVotes) {
    if (vote) {
      const details = voteDetails.get(vote.txnId);
      if (!details) continue;

      entries.push({
        proposalId: proposal.id,
        proposalTitle: proposalTitle(proposal),
        proposalStatus: proposalStatus(proposal),
        approvalVotes: details.approvalVotes,
        rejectionVotes: details.rejectionVotes,
        nullVotes: Math.max(
          0,
          Number(votingPower) - details.approvalVotes - details.rejectionVotes,
        ),
        totalVotes: Number(votingPower),
        timestamp: details.timestamp,
        txnId: vote.txnId,
        missed: false,
      });
      continue;
    }

    if (!pastVotingStatuses.has(proposal.status)) continue;

    entries.push({
      proposalId: proposal.id,
      proposalTitle: proposalTitle(proposal),
      proposalStatus: proposalStatus(proposal),
      approvalVotes: 0,
      rejectionVotes: 0,
      nullVotes: 0,
      totalVotes: Number(votingPower),
      timestamp: Number(proposal.voteOpenTs),
      txnId: "",
      missed: true,
    });
  }

  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries;
}

export function getExplorerTxnUrl(txnId: string): string {
  switch (network) {
    case "mainnet":
      return `https://allo.info/tx/${txnId}`;
    case "testnet":
      return `https://testnet.allo.info/tx/${txnId}`;
    default:
      return `https://allo.info/tx/${txnId}`;
  }
}
