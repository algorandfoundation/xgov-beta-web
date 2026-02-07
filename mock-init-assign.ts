import fs from "node:fs";
import crypto from "crypto";
import path from "path";
import algosdk from "algosdk";

// Parse command-line arguments
const args = process.argv.slice(2);
const shouldAssignVoters = !args.includes("--no-assign");
import { XGovRegistryFactory } from "@algorandfoundation/xgov/registry";
import type { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account";
import { algorand } from "@/api/algorand";
import { ProposalFactory } from "@algorandfoundation/xgov";
import { mockProposals } from "./__fixtures__/proposals";
import {
  DISCUSSION_DURATION_LARGE,
  DISCUSSION_DURATION_MEDIUM,
  DISCUSSION_DURATION_SMALL,
  DISCUSSION_DURATION_XLARGE,
  MAX_REQUESTED_AMOUNT_LARGE,
  MAX_REQUESTED_AMOUNT_MEDIUM,
  MAX_REQUESTED_AMOUNT_SMALL,
  MIN_REQUESTED_AMOUNT,
  PROPOSAL_COMMITMENT_BPS,
  PROPOSAL_FEE,
  PROPOSAL_PUBLISHING_BPS,
  PROPOSER_FEE,
  QUORUM_LARGE,
  QUORUM_MEDIUM,
  QUORUM_SMALL,
  VOTING_DURATION_LARGE,
  VOTING_DURATION_MEDIUM,
  VOTING_DURATION_SMALL,
  VOTING_DURATION_XLARGE,
  WEIGHTED_QUORUM_LARGE,
  WEIGHTED_QUORUM_MEDIUM,
  WEIGHTED_QUORUM_SMALL,
  XGOV_FEE,
} from "@/constants";
import { proposalApprovalBoxName, proposerBoxName, xGovBoxName } from "@/api";

const MAX_APP_TOTAL_ARG_LEN = 2048
const METHOD_SELECTOR_LENGTH = 4
const UINT64_LENGTH = 8
const DYNAMIC_BYTE_ARRAY_LENGTH_OVERHEAD = 4

function loadProposalContractDataSizePerTransaction() {
  return (
    MAX_APP_TOTAL_ARG_LEN
    - METHOD_SELECTOR_LENGTH
    - UINT64_LENGTH
    - DYNAMIC_BYTE_ARRAY_LENGTH_OVERHEAD
  )
}

function range(start: bigint, stop?: bigint, step?: bigint): bigint[] {
  if (stop === undefined) {
    stop = start;
    start = 0n;
  }
  if (step === undefined) {
    step = 1n;
  }

  const length = Math.ceil(Number((stop - start) / step));
  return Array.from({ length }, (_, i) => start + BigInt(i) * step);
}


/**
 * Converts a committee ID buffer to a base64url safe filename
 *
 * @param committeeId The committee ID as a Buffer
 * @returns A base64url encoded string safe for filenames
 */
function committeeIdToSafeFileName(committeeId: Buffer): string {
  // Use base64url encoding (base64 without padding, using URL-safe characters)
  return committeeId
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a SHA256 hash of the JSON string and returns it as a Buffer
 *
 * @param jsonData The JSON data to hash
 * @returns Buffer containing the SHA256 hash
 */
function generateCommitteeId(jsonData: string): Buffer {
  return crypto.createHash('sha256').update(jsonData).digest();
}

async function getLastRound(): Promise<bigint> {
  return (await algorand.client.algod.status().do()).lastRound;
}

async function getLatestTimestamp(): Promise<bigint> {
  const lastRound = await getLastRound();
  const block = await algorand.client.algod.block(lastRound).do();
  return block.block.header.timestamp;
}

export async function roundWarp(to: bigint = 0n) {
  algorand.setSuggestedParamsCacheTimeout(0);
  const dispenser = await algorand.account.dispenserFromEnvironment();
  let nRounds;
  if (to !== 0n) {
    const lastRound = await getLastRound();

    if (to < lastRound) {
      throw new Error(`Cannot warp to the past: ${to} < ${lastRound}`);
    }

    nRounds = to - lastRound;
  } else {
    nRounds = 1;
  }

  for (let i = 0; i < nRounds; i++) {
    await algorand.send.payment({
      sender: dispenser.addr,
      signer: dispenser.signer,
      receiver: dispenser.addr,
      amount: (0).microAlgo(),
      // adding a random note to avoid transaction duplicates
      note: new Uint8Array(crypto.randomBytes(16)),
    });
  }
}

export async function timeWarp(to: bigint) {
  algorand.setSuggestedParamsCacheTimeout(0);
  const current = await getLatestTimestamp();
  await algorand.client.algod.setBlockOffsetTimestamp(to - current).do();
  await roundWarp();
  await algorand.client.algod.setBlockOffsetTimestamp(0).do();
}

algorand.setSuggestedParamsCacheTimeout(0);
// Generate admin account (the one that creates the registry)
const fundAmount = (10).algo();
const adminAccount = await algorand.account.fromKmd(
  "unencrypted-default-wallet",
);
console.log("admin account", adminAccount.addr);
const dispenser = await algorand.account.dispenserFromEnvironment();

await algorand.account.ensureFunded(adminAccount.addr, dispenser, fundAmount);

// Create the registry
const registryMinter = new XGovRegistryFactory({
  algorand,
  defaultSender: adminAccount.addr,
  defaultSigner: adminAccount.signer,
  deployTimeParams: {
    entropy: "",
  },
});

const results = await registryMinter.send.create.create();
const registryClient = results.appClient;

// Fund the registry
await registryClient.appClient.fundAppAccount({
  sender: dispenser.addr,
  amount: (100).algos(),
});

// Initialize and load the proposal approval program
const proposalMinter = new ProposalFactory({
  algorand,
  defaultSender: adminAccount.addr,
  defaultSigner: adminAccount.signer,
});

const compiledProposal = await proposalMinter.appFactory.compile();
const size = compiledProposal.approvalProgram.length;
const dataSizePerTransaction = loadProposalContractDataSizePerTransaction();
const bulks = 1 + Math.floor(size / dataSizePerTransaction);

await registryClient.send.initProposalContract({args: { size }});

for (let i = 0; i < bulks; i++) {
  const chunk = compiledProposal.approvalProgram.slice(
    i * dataSizePerTransaction,
    (i + 1) * dataSizePerTransaction,
  );

  await registryClient.send.loadProposalContract({
    args: {
      offset: (i * dataSizePerTransaction),
      data: chunk,
    }
  });
}

console.log("Proposal approval program loaded successfully");

// Generate KYC provider account
const kycProvider = await algorand.account.fromKmd(
  "unencrypted-default-wallet",
);
console.log("kyc provider", kycProvider.addr);

await algorand.account.ensureFunded(kycProvider.addr, dispenser, fundAmount);

// Set KYC provider
await registryClient.send.setKycProvider({
  sender: adminAccount.addr,
  args: {
    provider: kycProvider.addr.toString(),
  },
});

// 963000
await registryClient.send.configXgovRegistry({
  sender: adminAccount.addr,
  args: {
    config: {
      xgovFee: XGOV_FEE,
      proposerFee: PROPOSER_FEE,
      openProposalFee: PROPOSAL_FEE,
      daemonOpsFundingBps: PROPOSAL_PUBLISHING_BPS,
      proposalCommitmentBps: PROPOSAL_COMMITMENT_BPS,
      minRequestedAmount: MIN_REQUESTED_AMOUNT,
      maxRequestedAmount: [
        MAX_REQUESTED_AMOUNT_SMALL,
        MAX_REQUESTED_AMOUNT_MEDIUM,
        MAX_REQUESTED_AMOUNT_LARGE,
      ],
      discussionDuration: [
        DISCUSSION_DURATION_SMALL,
        DISCUSSION_DURATION_MEDIUM,
        DISCUSSION_DURATION_LARGE,
        DISCUSSION_DURATION_XLARGE,
      ],
      votingDuration: [
        VOTING_DURATION_SMALL,
        VOTING_DURATION_MEDIUM,
        VOTING_DURATION_LARGE,
        VOTING_DURATION_XLARGE,
      ],
      quorum: [QUORUM_SMALL, QUORUM_MEDIUM, QUORUM_LARGE],
      weightedQuorum: [
        WEIGHTED_QUORUM_SMALL,
        WEIGHTED_QUORUM_MEDIUM,
        WEIGHTED_QUORUM_LARGE,
      ],
      absenceTolerance: 5n,
      governancePeriod: 1_000_000n,
      committeeGracePeriod: 10_000n,
    },
  },
});

await registryClient.send.setCommitteeManager({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    manager: adminAccount.addr.toString(),
  },
});

await registryClient.send.setXgovDaemon({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    xgovDaemon: adminAccount.addr.toString(),
  },
});

const admin: TransactionSignerAccount & { account: algosdk.Account; } = {
  addr: adminAccount.addr,
  signer: adminAccount.signer,
  account: adminAccount.account,
}

const committeeMembers: (TransactionSignerAccount & { account: algosdk.Account; })[] = [
  admin,
];

const committeeVotes: number[] = [100];
let committeeVotesSum = 100;

for (let i = 0; i < 400; i++) {
  const randomAccount = algorand.account.random();
  console.log('committee member', randomAccount.addr);
  committeeMembers.push(randomAccount);
  const votingPower = Math.floor(Math.random() * 1_000) + 1;
  committeeVotes.push(votingPower);
  committeeVotesSum += votingPower;
}

console.log('Total committee votes sum:', committeeVotesSum);

for (const committeeMember of committeeMembers) {
  await algorand.account.ensureFunded(
    committeeMember.addr,
    dispenser,
    fundAmount,
  );

  await registryClient.send.subscribeXgov({
    sender: committeeMember.addr,
    signer: committeeMember.signer,
    args: {
      votingAddress: committeeMember.addr.toString(),
      payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        amount: 1_000_000,
        sender: committeeMember.addr,
        receiver: registryClient.appAddress,
        suggestedParams: await algorand.getSuggestedParams(),
      }),
    }
  });
}

// Generate and setup mock proposer accounts
const proposerAccounts: (TransactionSignerAccount & {
  account: algosdk.Account;
})[] = [];
const proposalIds: bigint[] = [];
const proposerFee = PROPOSER_FEE.microAlgo();
const proposalFee = PROPOSAL_FEE.microAlgo();

// get suggestedparams
const suggestedParams = await algorand.getSuggestedParams();

const oneYearFromNow = (await getLatestTimestamp()) + 365n * 24n * 60n * 60n;

const proposalFactory = new ProposalFactory({ algorand });

const metadataBoxName = new Uint8Array(Buffer.from("M"))

// Before time warp, create random committee pairs
// Each pair of proposals gets assigned a random committee of 200 members
console.log("\nCreating random committee pairs for proposals...");

// Shuffle the proposals to create random pairs (using indices since proposalIds isn't populated yet)
const proposalIndices = [...Array(mockProposals.length).keys()].map(i => BigInt(i));
const shuffledProposals = [...proposalIndices].sort(() => Math.random() - 0.5);

// Create pairs of proposals (handle odd number by having one triple if necessary)
const proposalPairs: bigint[][] = [];
for (let i = 0; i < shuffledProposals.length; i += 2) {
  if (i + 1 < shuffledProposals.length) {
    // Standard pair
    proposalPairs.push([shuffledProposals[i], shuffledProposals[i + 1]]);
  } else {
    // Last proposal without a pair - add to the last pair to make a triple
    // This handles cases with an odd number of proposals
    if (proposalPairs.length > 0) {
      proposalPairs[proposalPairs.length - 1].push(shuffledProposals[i]);
    } else {
      // If there's only one proposal to assign
      proposalPairs.push([shuffledProposals[i]]);
    }
  }
}

// Map to keep track of which committee is assigned to which proposal
const proposalToCommitteeMap = new Map<bigint, Buffer>();

// Create committees directory if it doesn't exist
const committeesDir = 'src/pages/api/committees-dev';
if (!fs.existsSync(committeesDir)) {
  fs.mkdirSync(committeesDir, { recursive: true });
}

// Generate a committee for each pair (without declaring yet)
console.log("Generating committees for proposal pairs...");
for (const pair of proposalPairs) {
  // Select 200 random committee members for this pair
  const shuffledMembers = [...Array(committeeMembers.length).keys()]
    .sort(() => Math.random() - 0.5)
    .slice(0, 200);

  // Create committee data for this pair
  const committeeData = {
    xGovs: shuffledMembers.map(idx => ({
      address: committeeMembers[idx].addr.toString(),
      votes: committeeVotes[idx]
    }))
  };

  // Calculate the vote sum for this committee
  const committeeVoteSum = committeeData.xGovs.reduce((sum, member) => sum + member.votes, 0);

  // Convert to JSON string
  const committeeJson = JSON.stringify(committeeData, (_, v) =>
    typeof v === "bigint" ? v.toString() : v, 2);

  // Generate committee ID from the JSON content
  const committeeId = generateCommitteeId(committeeJson);
  const safeFileName = committeeIdToSafeFileName(committeeId);

  // Write committee data to file
  const filePath = path.join(committeesDir, `${safeFileName}.json`);
  fs.writeFileSync(filePath, committeeJson, "utf-8");

  // Associate each proposal in the pair with this committee info
  pair.forEach(proposalId => {
    proposalToCommitteeMap.set(proposalId, committeeId);
  });

  console.log(`Created committee ${safeFileName} for proposals: ${pair.join(', ')}`);
  console.log(`Committee size: ${committeeData.xGovs.length} voters with ${committeeVoteSum} total votes`);
}

// Log the committee assignments
console.log('\nProposal to Committee Assignments:');
proposalToCommitteeMap.forEach((committeeId, proposalId) => {
  console.log(`Proposal ${proposalId}: Committee ${committeeIdToSafeFileName(committeeId)}`);
});


for (let i = 0; i < mockProposals.length; i++) {
  let account: TransactionSignerAccount & { account: algosdk.Account };

  if (i == 0) {
    // First proposal is by the KMD default account (i.e., adminAccount)
    account = adminAccount;
  } else {
    account = algorand.account.random();
  }

  console.log("\nproposer account", account.addr);

  await algorand.account.ensureFunded(
    account.addr,
    dispenser,
    (1000000).algo(),
  );

  proposerAccounts.push(account);

  // Subscribe as proposer
  await registryClient.send.subscribeProposer({
    sender: account.addr,
    signer: account.signer,
    args: {
      payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        amount: proposerFee.microAlgos,
        sender: account.addr,
        receiver: registryClient.appAddress,
        suggestedParams,
      }),
    }
  });

  try {
    // Approve proposer KYC
    await registryClient.send.setProposerKyc({
      sender: kycProvider.addr,
      signer: kycProvider.signer,
      args: {
        proposer: account.addr.toString(),
        kycStatus: true,
        kycExpiring: BigInt(oneYearFromNow),
      }
    });
  } catch (e) {
    console.error("Failed to approve proposer KYC");
    process.exit(1);
  }

  // Get the committee ID for this proposal (using index since proposalIds isn't populated yet)
  const committeeId = proposalToCommitteeMap.get(BigInt(i));

  if (!committeeId) {
    console.error(`No committee ID found for proposal index ${i}`);
    process.exit(1);
  }

  console.log(`Preparing to declareCommittee proposal index ${i} with committee ID ${committeeIdToSafeFileName(committeeId)}`);

  // For this specific proposal, get its committee's vote info
  const committeeFilePath = path.join(committeesDir, `${committeeIdToSafeFileName(committeeId)}.json`);
  const committeeDataStr = fs.readFileSync(committeeFilePath, 'utf-8');
  const committeeData = JSON.parse(committeeDataStr);
  const committeeVoteSum = committeeData.xGovs.reduce((sum: number, member: any) => sum + member.votes, 0);

  // Declare this committee right before submitting the proposal
  console.log(`Declaring committee ${committeeIdToSafeFileName(committeeId)} for proposal index ${i}`);
  await registryClient.send.declareCommittee({
    sender: adminAccount.addr,
    signer: adminAccount.signer,
    args: {
      committeeId,
      size: committeeData.xGovs.length,
      votes: committeeVoteSum,
    },
  });

  // Create a proposal
  const result = await registryClient.send.openProposal({
    sender: account.addr,
    signer: account.signer,
    args: {
      payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        amount: proposalFee.microAlgos,
        sender: account.addr,
        receiver: registryClient.appAddress,
        suggestedParams,
      }),
    },
    extraFee: (2_000).microAlgos(),
  });

  // Store proposal ID if available
  if (!result.return) {
    console.error("Proposal creation failed");
    process.exit(1);
  }

  console.log(`\nNew Proposal: ${result.return}\n`);

  // Store the actual proposal app ID
  proposalIds.push(result.return);

  // instance a new proposal client
  const proposalClient = proposalFactory.getAppClientById({
    appId: result.return,
  });

  const metadata = new Uint8Array(Buffer.from(JSON.stringify(
    mockProposals[i].proposalJson,
    (_, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
  )));

  let chunkedMetadata: Uint8Array<ArrayBuffer>[] = []
  for (let j = 0; j < metadata.length; j += 2041) {
    const chunk = metadata.slice(j, j + 2041);
    chunkedMetadata.push(chunk);
  }

  const proposalSubmissionFee = Math.trunc(
    Number(
      (mockProposals[i].requestedAmount.algos().microAlgos * PROPOSAL_COMMITMENT_BPS) /
      BigInt(10_000),
    ),
  );

  console.log(`Payment Amount: ${proposalSubmissionFee}\n`);
  console.log(`Title: ${mockProposals[i].title}\n`);
  console.log(`Funding Type: ${mockProposals[i].fundingType}\n`);
  console.log(
    `Requested Amount: ${mockProposals[i].requestedAmount.algos().microAlgos}\n`,
  );
  console.log(`Focus: ${mockProposals[i].focus}\n\n`);

  try {
    const openGroup = proposalClient
      .newGroup()
      .open({
        sender: account.addr,
        signer: account.signer,
        args: {
          payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            amount: proposalSubmissionFee,
            sender: account.addr,
            receiver: proposalClient.appAddress,
            suggestedParams,
          }),
          title: mockProposals[i].title,
          fundingType: mockProposals[i].fundingType,
          requestedAmount: mockProposals[i].requestedAmount.algos().microAlgos,
          focus: mockProposals[i].focus,
        },
      })

    chunkedMetadata.map((chunk, index) => {
      openGroup.uploadMetadata({
        sender: account.addr,
        signer: account.signer,
        args: {
          payload: chunk,
          isFirstInGroup: index === 0,
        }
      });
    })

    console.log(`Opening proposal index ${i}...`);
    await openGroup.send()
  } catch (e) {
    console.log(e);

    console.error("Failed to open proposal");

    process.exit(1);
  }
}

// Time warp to move proposals past the discussion phase (discussion duration is 60 seconds)
const ts = (await getLatestTimestamp()) + 65n; // 65 seconds to ensure discussion period is over
await timeWarp(ts);
console.log("finished time warp, new ts: ", await getLatestTimestamp());

// Let's submit all proposals except the first one, owned by admin
// This moves them to the voting phase
for (let i = 1; i < mockProposals.length; i++) {
  const proposalClient = proposalFactory.getAppClientById({
    appId: proposalIds[i],
  });


  // Now submit the proposal immediately after declaring its committee
  console.log(`Submitting proposal ${proposalIds[i]}`);
  await proposalClient.send.submit({
    sender: proposerAccounts[i].addr,
    signer: proposerAccounts[i].signer,
    args: {},
    extraFee: (1_000).microAlgos(),
  });
}

// Set admin account as xGov Council to avoid having to click through admin panel
await registryClient.send.setXgovCouncil({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: { council: adminAccount.addr.toString() },
});

// Assign voters to each submitted proposal
if (shouldAssignVoters) {
console.log("\nAssigning voters to proposals...");

const FIRST_TXN_VOTERS = 7;
const OTHER_TXN_VOTERS = 8;

for (let i = 1; i < mockProposals.length; i++) {
  const proposalId = proposalIds[i];
  const proposalIndex = BigInt(i);
  const committeeId = proposalToCommitteeMap.get(proposalIndex);
  
  if (!committeeId) {
    console.log(`No committee found for proposal ${proposalId}, skipping...`);
    continue;
  }

  const safeFileName = committeeIdToSafeFileName(committeeId);
  const filePath = path.join(committeesDir, `${safeFileName}.json`);
  const committeeData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  
  const proposalClient = proposalFactory.getAppClientById({
    appId: proposalId,
  });

  console.log(`Assigning ${committeeData.xGovs.length} voters to proposal ${proposalId}...`);

  // Process voters in batches
  const voters: { address: string; votes: number }[] = committeeData.xGovs;
  let processedVoters = 0;

  while (processedVoters < voters.length) {
    const txnGroup = proposalClient.newGroup();
    let votersInGroup = 0;
    let txnsInGroup = 0;

    // Build up to 16 transactions per group
    while (txnsInGroup < 16 && processedVoters + votersInGroup < voters.length) {
      const votersPerTxn = txnsInGroup === 0 ? FIRST_TXN_VOTERS : OTHER_TXN_VOTERS;
      const batchStart = processedVoters + votersInGroup;
      const batchEnd = Math.min(batchStart + votersPerTxn, voters.length);
      const batch = voters.slice(batchStart, batchEnd);

      if (batch.length === 0) break;

      const voterTuples: [string, number][] = batch.map(v => [v.address, v.votes]);

      txnGroup.assignVoters({
        sender: adminAccount.addr,
        signer: adminAccount.signer,
        args: { voters: voterTuples },
        extraFee: txnsInGroup === 0 ? (1_000).microAlgos() : undefined,
      });

      votersInGroup += batch.length;
      txnsInGroup++;
    }

    if (votersInGroup > 0) {
      await txnGroup.send();
      processedVoters += votersInGroup;
      console.log(`  Assigned ${processedVoters}/${voters.length} voters...`);
    }
  }

  console.log(`Completed assigning voters to proposal ${proposalId}`);
}

console.log("\nVoters assigned! Voting period is now active (10 minutes).");

// Time warp to just after voting period ends (voting duration is 600 seconds / 10 minutes)
const votingEndWarp = (await getLatestTimestamp()) + 605n; // 10 minutes + 5 seconds past voting end
await timeWarp(votingEndWarp);
console.log("Time warped to just after voting period ends.");

// Scrutinize all submitted proposals (all except proposal index 0 which is admin's)
console.log("\nScrutinizing proposals...");
for (let i = 1; i < mockProposals.length; i++) {
  const proposalClient = proposalFactory.getAppClientById({
    appId: proposalIds[i],
  });

  console.log(`Scrutinizing proposal ${proposalIds[i]}...`);
  await proposalClient.send.scrutiny({
    sender: adminAccount.addr,
    signer: adminAccount.signer,
    args: {},
    extraFee: (1000).microAlgo(),
  });
}
console.log("All proposals scrutinized.");
} else {
  console.log("\nSkipping voter assignment (--no-assign flag used).");
  console.log("You can use the assign API to assign voters manually.");
}

console.log({
  adminAccount,
  kycProvider,
  proposerAccounts,
  proposalIds,
});

console.log(
  `Use the following application to interact with the registry:\n`,
  results.appClient.appId,
  `\n\n`,
);

if (shouldAssignVoters) {
  // Pick a few random proposal IDs for the example curl command (as strings for bigint serialization)
  const randomProposalIds = proposalIds.slice(1, 4).map(id => `"${id}"`).join(", ");
  console.log(`Voters have been assigned. Voting period has ended.

Start the server:

  npm run dev

get the server port from the console output (probably 4321), and then run:

  curl -X POST http://localhost:4321/api/unassign -H "Content-Type: application/json" -d '{"proposalIds": [${randomProposalIds}]}' -s | jq '.'

to unassign voters from specific proposals, or:

  curl -X POST http://localhost:4321/api/unassign -H "Content-Type: application/json" -d '{}' -s | jq '.'

to unassign voters from all proposals
`);
} else {
  // Pick a few random proposal IDs for the example curl command (as strings for bigint serialization)
  const randomProposalIds = proposalIds.slice(1, 4).map(id => `"${id}"`).join(", ");
  console.log(`Voters NOT assigned. Voting period is active for 10 minutes.

Start the server:

  npm run dev

get the server port from the console output (probably 4321), and then run:

  curl -X POST http://localhost:4321/api/assign -H "Content-Type: application/json" -d '{"proposalIds": [${randomProposalIds}]}' -s | jq '.'

then run:

  curl -X POST http://localhost:4321/api/assign -H "Content-Type: application/json" -d '{}' -s | jq '.'

to assign the remaining proposals
`);
}
const envFile = fs.readFileSync("./.env.template", "utf-8");
fs.writeFileSync(
  ".env.development",
  envFile.replace(
    "<REPLACE_WITH_REGISTRY_APP_ID>",
    results.appClient.appId.toString(),
  ).replace(
    "<REPLACE_WITH_DAEMON_MNEMONIC>",
    `"${algosdk.secretKeyToMnemonic(adminAccount.account.sk)}"`,
  ),
  "utf-8",
);
fs.writeFileSync(
  ".deployment.json",
  JSON.stringify(
    {
      adminAccount: {
        secret: algosdk.secretKeyToMnemonic(adminAccount.account.sk),
        addr: adminAccount.addr,
      },
      kycProvider: {
        secret: algosdk.secretKeyToMnemonic(kycProvider.account.sk),
        addr: kycProvider.addr,
      },
      proposerAccounts: proposerAccounts.map((acct) => {
        return {
          secret: algosdk.secretKeyToMnemonic(acct.account.sk),
          addr: acct.account.addr,
        };
      }),
      proposalIds,
      xGovs: committeeMembers.map((member, index) => {
        return {
          address: member.addr.toString(),
          votes: committeeVotes[index],
        };
      })
    },
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  ),
  "utf-8",
);
