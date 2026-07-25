import algosdk from "algosdk";
import { indexer, network } from "@/api/algorand/algo-client";
import { RegistryAppID } from "@/api/algorand/contract-clients";
import { getAllProposals } from "@/api/proposals";
import { getXGovCommitteeMap } from "@/api/committee";
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

const VOTE_PROPOSAL_METHOD = new algosdk.ABIMethod({
  name: "vote_proposal",
  args: [
    { type: "uint64", name: "proposal_id" },
    { type: "address", name: "xgov_address" },
    { type: "uint64", name: "approval_votes" },
    { type: "uint64", name: "rejection_votes" },
  ],
  returns: { type: "void" },
});

const VOTE_PROPOSAL_SELECTOR = VOTE_PROPOSAL_METHOD.getSelector();
const VOTE_EVENT_SELECTORS = [
  new Uint8Array([0x5e, 0xf0, 0xd3, 0xf1]),
  new Uint8Array([0x15, 0x77, 0xf6, 0xe7]), // Legacy first proposal
];

function selectorMatches(arg: Uint8Array): boolean {
  if (arg.length < 4) return false;
  for (let i = 0; i < 4; i++) {
    if (arg[i] !== VOTE_PROPOSAL_SELECTOR[i]) return false;
  }
  return true;
}

function voteEventMatches(log: Uint8Array, xgovAddress: string): boolean {
  if (log.length < 36) return false;
  const selectorMatches = VOTE_EVENT_SELECTORS.some((selector) =>
    selector.every((byte, index) => log[index] === byte),
  );
  return (
    selectorMatches && algosdk.encodeAddress(log.slice(4, 36)) === xgovAddress
  );
}

function getIndexerField<T>(
  value: Record<string, unknown>,
  camelKey: string,
  kebabKey: string,
): T | undefined {
  return (value[camelKey] ?? value[kebabKey]) as T | undefined;
}

function bytesFromIndexerArg(arg: Uint8Array | string): Uint8Array {
  if (typeof arg !== "string") return arg;
  return new Uint8Array(Buffer.from(arg, "base64"));
}

function appIdMatches(applicationId: bigint | number | undefined): boolean {
  return applicationId !== undefined && BigInt(applicationId) === RegistryAppID;
}

async function fetchProposalVoteTransaction(
  proposalId: bigint,
  xgovAddress: string,
): Promise<any | undefined> {
  let nextToken: string | undefined;
  const seenTokens = new Set<string>();

  do {
    let query = indexer.lookupApplicationLogs(proposalId).limit(1000);
    if (nextToken) query = query.nextToken(nextToken);

    const response = await query.do();
    for (const logData of response.logData ?? []) {
      if (logData.logs.some((log) => voteEventMatches(log, xgovAddress))) {
        return (await indexer.lookupTransactionByID(logData.txid).do())
          .transaction;
      }
    }

    if (!response.nextToken || seenTokens.has(response.nextToken)) break;
    seenTokens.add(response.nextToken);
    nextToken = response.nextToken;
  } while (nextToken);

  return undefined;
}

export async function getVotingHistory(
  xgovAddress: string,
  votingAddress?: string,
): Promise<VoteHistoryEntry[]> {
  // Kept for API compatibility; proposal events identify delegated votes by xGov.
  void votingAddress;

  const proposals = await getAllProposals();
  const committeeCache = new Map<
    string,
    Promise<Map<string, number> | undefined>
  >();

  function loadCommittee(
    committeeId: Uint8Array,
  ): Promise<Map<string, number> | undefined> {
    const committeeKey = Buffer.from(committeeId).toString("base64");
    let committee = committeeCache.get(committeeKey);
    if (!committee) {
      committee = getXGovCommitteeMap(Buffer.from(committeeId)).catch(
        () => undefined,
      );
      committeeCache.set(committeeKey, committee);
    }
    return committee;
  }

  // Committee membership limits the search to proposals relevant to this xGov.
  const relevantProposals = (
    await Promise.all(
      proposals.map(async (proposal) => {
        if (!proposal.committeeId || proposal.committeeId.length === 0) {
          return undefined;
        }
        const committee = await loadCommittee(proposal.committeeId);
        return committee?.has(xgovAddress) ? proposal : undefined;
      }),
    )
  ).filter((proposal): proposal is ProposalSummaryCardDetails => !!proposal);

  const allTransactions = await Promise.all(
    relevantProposals.map((proposal) =>
      fetchProposalVoteTransaction(proposal.id, xgovAddress),
    ),
  );

  // Filter for voteProposal calls to the registry app
  const voteTxns: {
    proposalId: bigint;
    xgovAddr: string;
    approvalVotes: number;
    rejectionVotes: number;
    timestamp: number;
    txnId: string;
  }[] = [];

  for (const txn of allTransactions) {
    if (!txn) continue;
    const appTxn = getIndexerField<Record<string, unknown>>(
      txn,
      "applicationTransaction",
      "application-transaction",
    );
    if (!appTxn) continue;

    // Must be a call to the registry app
    const applicationId = getIndexerField<bigint | number>(
      appTxn,
      "applicationId",
      "application-id",
    );
    if (!appIdMatches(applicationId)) continue;

    const args = getIndexerField<Array<Uint8Array | string>>(
      appTxn,
      "applicationArgs",
      "application-args",
    );
    if (!args || args.length < 5) continue;

    // Check method selector
    const encodedArgs = args.map(bytesFromIndexerArg);
    if (!selectorMatches(encodedArgs[0])) continue;

    // Decode ABI args
    const proposalId = algosdk.ABIType.from("uint64").decode(
      encodedArgs[1],
    ) as bigint;
    const decodedAddress = algosdk.encodeAddress(encodedArgs[2]);
    const approvalVotes = Number(
      algosdk.ABIType.from("uint64").decode(encodedArgs[3]) as bigint,
    );
    const rejectionVotes = Number(
      algosdk.ABIType.from("uint64").decode(encodedArgs[4]) as bigint,
    );

    // Only include votes for this xGov's address
    if (decodedAddress !== xgovAddress) continue;

    voteTxns.push({
      proposalId,
      xgovAddr: decodedAddress,
      approvalVotes,
      rejectionVotes,
      timestamp: getIndexerField<number>(txn, "roundTime", "round-time") ?? 0,
      txnId: txn.id ?? "",
    });
  }

  // Cross-reference with proposals for titles and status
  const proposalMap = new Map<bigint, ProposalSummaryCardDetails>();
  for (const p of proposals) {
    proposalMap.set(p.id, p);
  }

  // Track which proposals the xGov actually voted on
  const votedProposalIds = new Set(voteTxns.map((v) => v.proposalId));
  const entries: VoteHistoryEntry[] = [];

  // Build entries for actual votes
  for (const vote of voteTxns) {
    const proposal = proposalMap.get(vote.proposalId);
    const proposalTitle = proposal?.title ?? `Proposal ${vote.proposalId}`;
    const proposalStatus = proposal
      ? (ProposalStatusMap[proposal.status] ?? "Unknown")
      : "Unknown";

    let totalVotes = vote.approvalVotes + vote.rejectionVotes;

    if (proposal?.committeeId && proposal.committeeId.length > 0) {
      const memberMap = await loadCommittee(proposal.committeeId);
      if (memberMap) {
        const memberVotes = memberMap.get(xgovAddress);
        if (memberVotes !== undefined) {
          totalVotes = memberVotes;
        }
      }
    }

    const nullVotes = Math.max(
      0,
      totalVotes - vote.approvalVotes - vote.rejectionVotes,
    );

    entries.push({
      proposalId: vote.proposalId,
      proposalTitle,
      proposalStatus,
      approvalVotes: vote.approvalVotes,
      rejectionVotes: vote.rejectionVotes,
      nullVotes,
      totalVotes,
      timestamp: vote.timestamp,
      txnId: vote.txnId,
      missed: false,
    });
  }

  // Statuses that indicate voting is over
  const pastVotingStatuses = new Set([
    ProposalStatus.ProposalStatusApproved,
    ProposalStatus.ProposalStatusRejected,
    ProposalStatus.ProposalStatusReviewed,
    ProposalStatus.ProposalStatusFunded,
    ProposalStatus.ProposalStatusBlocked,
  ]);

  // Detect missed votes: proposals where the xGov was in the committee but never voted
  for (const proposal of proposals) {
    // Skip if the xGov already voted on this proposal
    if (votedProposalIds.has(proposal.id)) continue;

    // Only consider proposals that are past the voting phase
    if (!pastVotingStatuses.has(proposal.status)) continue;

    // Must have a committee to check membership
    if (!proposal.committeeId || proposal.committeeId.length === 0) continue;

    const memberMap = await loadCommittee(proposal.committeeId);
    if (!memberMap) continue;

    const memberVotes = memberMap.get(xgovAddress);
    if (memberVotes === undefined) continue;

    // This xGov was in the committee but never voted — missed vote
    entries.push({
      proposalId: proposal.id,
      proposalTitle: proposal.title || `Proposal ${proposal.id}`,
      proposalStatus: ProposalStatusMap[proposal.status] ?? "Unknown",
      approvalVotes: 0,
      rejectionVotes: 0,
      nullVotes: 0,
      totalVotes: memberVotes,
      timestamp: Number(proposal.voteOpenTs),
      txnId: "",
      missed: true,
    });
  }

  // Sort by timestamp descending (most recent first)
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
