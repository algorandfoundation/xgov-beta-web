import algosdk from "algosdk";
import { indexer, network } from "@/api/algorand/algo-client";
import { RegistryAppID } from "@/api/algorand/contract-clients";
import { getAllProposals } from "@/api/proposals";
import { getCommitteeData } from "@/api/committee";
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
  name: "voteProposal",
  args: [
    { type: "uint64", name: "proposalId" },
    { type: "address", name: "xgovAddress" },
    { type: "uint64", name: "approvalVotes" },
    { type: "uint64", name: "rejectionVotes" },
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

async function fetchAllAppCallTransactions(address: string) {
  const allTransactions: any[] = [];
  let nextToken: string | undefined;

  do {
    let query = indexer
      .lookupAccountTransactions(address)
      .txType("appl")
      .limit(1000);

    if (nextToken) {
      query = query.nextToken(nextToken);
    }

    const response = await query.do();
    allTransactions.push(...response.transactions);
    nextToken = response.nextToken;
  } while (nextToken);

  return allTransactions;
}

export async function getVotingHistory(
  xgovAddress: string,
  votingAddress?: string,
): Promise<VoteHistoryEntry[]> {
  // Fetch transactions for both the xGov address and their voting address (if delegated)
  const addresses = new Set([xgovAddress]);
  if (votingAddress && votingAddress !== xgovAddress) {
    addresses.add(votingAddress);
  }

  const transactionSets = await Promise.all(
    [...addresses].map((addr) => fetchAllAppCallTransactions(addr)),
  );
  const allTransactions = transactionSets.flat();

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
    const appTxn = txn.applicationTransaction;
    if (!appTxn) continue;

    // Must be a call to the registry app
    if (appTxn.applicationId !== RegistryAppID) continue;

    const args = appTxn.applicationArgs;
    if (!args || args.length < 5) continue;

    // Check method selector
    if (!selectorMatches(args[0])) continue;

    // Decode ABI args
    const proposalId = algosdk.ABIType.from("uint64").decode(
      args[1],
    ) as bigint;
    const decodedAddress = algosdk.encodeAddress(args[2]);
    const approvalVotes = Number(
      algosdk.ABIType.from("uint64").decode(args[3]) as bigint,
    );
    const rejectionVotes = Number(
      algosdk.ABIType.from("uint64").decode(args[4]) as bigint,
    );

    // Only include votes for this xGov's address
    if (decodedAddress !== xgovAddress) continue;

    voteTxns.push({
      proposalId,
      xgovAddr: decodedAddress,
      approvalVotes,
      rejectionVotes,
      timestamp: txn.roundTime ?? 0,
      txnId: txn.id ?? "",
    });
  }

  // Cross-reference with proposals for titles and status
  const proposals = await getAllProposals();
  const proposalMap = new Map<bigint, ProposalSummaryCardDetails>();
  for (const p of proposals) {
    proposalMap.set(p.id, p);
  }

  // Track which proposals the xGov actually voted on
  const votedProposalIds = new Set(voteTxns.map((v) => v.proposalId));

  // Load committee data for each unique committeeId to get totalVotes per member
  const committeeCache = new Map<string, Map<string, number>>();

  async function loadCommittee(
    committeeId: Uint8Array,
  ): Promise<Map<string, number> | undefined> {
    const committeeKey = Buffer.from(committeeId).toString("base64");
    if (!committeeCache.has(committeeKey)) {
      try {
        const committeeData = await getCommitteeData(
          Buffer.from(committeeId),
        );
        if (committeeData) {
          const memberMap = new Map<string, number>();
          for (const member of committeeData.xGovs) {
            memberMap.set(member.address, member.votes);
          }
          committeeCache.set(committeeKey, memberMap);
        }
      } catch {
        // Committee data not available
      }
    }
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
