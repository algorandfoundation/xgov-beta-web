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

function selectorMatches(arg: Uint8Array): boolean {
  if (arg.length < 4) return false;
  for (let i = 0; i < 4; i++) {
    if (arg[i] !== VOTE_PROPOSAL_SELECTOR[i]) return false;
  }
  return true;
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

async function fetchRegistryAppCallTransactions() {
  const allTransactions: any[] = [];
  let nextToken: string | undefined;

  do {
    let query = indexer
      .searchForTransactions()
      .txType("appl")
      .applicationID(RegistryAppID)
      .limit(1000);

    if (nextToken) {
      query = query.nextToken(nextToken);
    }

    const response = await query.do();
    allTransactions.push(...response.transactions);
    nextToken =
      response.nextToken ??
      (response as unknown as Record<string, string | undefined>)["next-token"];
  } while (nextToken);

  return allTransactions;
}

export async function getVotingHistory(
  xgovAddress: string,
): Promise<VoteHistoryEntry[]> {
  // The xGov address is an ABI argument, not necessarily a transaction account.
  // Search the registry instead of the account so delegated votes remain visible
  // after the delegate changes or the xGov unsubscribes. This also avoids paging
  // through every unrelated app call involving a high-activity account.
  const [allTransactions, proposals] = await Promise.all([
    fetchRegistryAppCallTransactions(),
    getAllProposals(),
  ]);

  // Filter for voteProposal calls to the registry app
  const voteTxns: {
    proposalId: bigint;
    approvalVotes: number;
    rejectionVotes: number;
    timestamp: number;
    txnId: string;
  }[] = [];

  for (const txn of allTransactions) {
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
      approvalVotes,
      rejectionVotes,
      timestamp: getIndexerField<number>(txn, "roundTime", "round-time") ?? 0,
      txnId: txn.id ?? "",
    });
  }

  const proposalMap = new Map<bigint, ProposalSummaryCardDetails>();
  for (const p of proposals) {
    proposalMap.set(p.id, p);
  }

  // Track which proposals the xGov actually voted on
  const votedProposalIds = new Set(voteTxns.map((v) => v.proposalId));

  // Load each committee once and in parallel. Committee membership is needed
  // both to recover the total voting power and to identify missed votes.
  const committeeIds = new Map<string, Uint8Array>();
  for (const proposal of proposals) {
    if (!proposal.committeeId || proposal.committeeId.length === 0) continue;
    const key = Buffer.from(proposal.committeeId).toString("base64");
    committeeIds.set(key, proposal.committeeId);
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

  function loadCommittee(
    committeeId: Uint8Array,
  ): Map<string, number> | undefined {
    const committeeKey = Buffer.from(committeeId).toString("base64");
    return committeeCache.get(committeeKey);
  }

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
      const memberMap = loadCommittee(proposal.committeeId);
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

    const memberMap = loadCommittee(proposal.committeeId);
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
