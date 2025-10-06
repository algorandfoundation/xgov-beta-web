import fs from "node:fs";
import crypto from "crypto";
import path from "path";
import algosdk, { ALGORAND_MIN_TX_FEE } from "algosdk";
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
import { proposerBoxName, xGovBoxName } from "@/api";

// Define committee pair interface for later use
interface CommitteePair {
  proposals: bigint[];
  committeeId: Buffer;
  committeeMembers: {
    address: string;
    votes: number;
  }[];
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

async function getLastRound(): Promise<number> {
  return (await algorand.client.algod.status().do())["last-round"];
}

async function getLatestTimestamp(): Promise<number> {
  const lastRound = await getLastRound();
  const block = await algorand.client.algod.block(lastRound).do();
  return block.block.ts;
}

export async function roundWarp(to: number = 0) {
  algorand.setSuggestedParamsCacheTimeout(0);
  const dispenser = await algorand.account.dispenserFromEnvironment();
  let nRounds;
  if (to !== 0) {
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

export async function timeWarp(to: number) {
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
    provider: kycProvider.addr,
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
    },
  },
});

await registryClient.send.setCommitteeManager({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    manager: adminAccount.addr,
  },
});

await registryClient.send.setXgovDaemon({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    xgovDaemon: adminAccount.addr,
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
      votingAddress: committeeMember.addr,
      payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        amount: 1_000_000,
        from: committeeMember.addr,
        to: registryClient.appAddress.toString(),
        suggestedParams: await algorand.getSuggestedParams(),
      }),
    },
    boxReferences: [
      xGovBoxName(committeeMember.addr),
    ],
  });
}

// Generate and setup mock proposer accounts
const proposerAccounts: (TransactionSignerAccount & {
  account: algosdk.Account;
})[] = [];
const proposalIds: bigint[] = range(BigInt(mockProposals.length));
const proposerFee = PROPOSER_FEE.microAlgo();
const proposalFee = PROPOSAL_FEE.microAlgo();

// get suggestedparams
const suggestedParams = await algorand.getSuggestedParams();

const oneYearFromNow = (await getLatestTimestamp()) + 365 * 24 * 60 * 60;

const proposalFactory = new ProposalFactory({ algorand });

const metadataBoxName = new Uint8Array(Buffer.from("M"))

// Before time warp, create random committee pairs
// Each pair of proposals gets assigned a random committee of 200 members
console.log("\nCreating random committee pairs for proposals...");

// Shuffle the proposals to create random pairs
const shuffledProposals = [...proposalIds].sort(() => Math.random() - 0.5);

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
      address: committeeMembers[idx].addr,
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

  // Store committee data for later use when submitting
  const committeeInfo = {
    committeeId,
    size: committeeData.xGovs.length,
    votes: committeeVoteSum,
    fileName: safeFileName
  };

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

  const addr = algosdk.decodeAddress(account.addr).publicKey;

  // Subscribe as proposer
  await registryClient.send.subscribeProposer({
    sender: account.addr,
    signer: account.signer,
    args: {
      payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        amount: proposerFee.microAlgos,
        from: account.addr,
        to: registryClient.appAddress.toString(),
        suggestedParams,
      }),
    },
    boxReferences: [proposerBoxName(account.addr)],
  });

  try {
    // Approve proposer KYC
    await registryClient.send.setProposerKyc({
      sender: kycProvider.addr,
      signer: kycProvider.signer,
      args: {
        proposer: account.addr,
        kycStatus: true,
        kycExpiring: BigInt(oneYearFromNow),
      },
      boxReferences: [proposerBoxName(account.addr)],
    });
  } catch (e) {
    console.error("Failed to approve proposer KYC");
    process.exit(1);
  }

  // Get the committee ID for this proposal
  const committeeId = proposalToCommitteeMap.get(proposalIds[i]);

  if (!committeeId) {
    console.error(`No committee ID found for proposal ${proposalIds[i]}`);
    process.exit(1);
  }

  console.log(`Preparing to declareCommittee proposal ${proposalIds[i]} with committee ID ${committeeIdToSafeFileName(committeeId)}`);

  // For this specific proposal, get its committee's vote info
  const committeeFilePath = path.join(committeesDir, `${committeeIdToSafeFileName(committeeId)}.json`);
  const committeeDataStr = fs.readFileSync(committeeFilePath, 'utf-8');
  const committeeData = JSON.parse(committeeDataStr);
  const committeeVoteSum = committeeData.xGovs.reduce((sum: number, member: any) => sum + member.votes, 0);

  // Declare this committee right before submitting the proposal
  console.log(`Declaring committee ${committeeIdToSafeFileName(committeeId)} for proposal ${proposalIds[i]}`);
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
        from: account.addr,
        to: registryClient.appAddress.toString(),
        suggestedParams,
      }),
    },
    boxReferences: [proposerBoxName(account.addr)],
    extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
  });

  // Store proposal ID if available
  if (!result.return) {
    console.error("Proposal creation failed");
    process.exit(1);
  }

  console.log(`\nNew Proposal: ${result.return}\n`);

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
      (mockProposals[i].requestedAmount.algos().microAlgos * BigInt(1_000)) /
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
            from: account.addr,
            to: proposalClient.appAddress.toString(),
            suggestedParams,
          }),
          title: mockProposals[i].title,
          fundingType: mockProposals[i].fundingType,
          requestedAmount: mockProposals[i].requestedAmount.algos().microAlgos,
          focus: mockProposals[i].focus,
        },
        appReferences: [registryClient.appId],
      })

    chunkedMetadata.map((chunk, index) => {
      openGroup.uploadMetadata({
        sender: account.addr,
        signer: account.signer,
        args: {
          payload: chunk,
          isFirstInGroup: index === 0,
        },
        appReferences: [registryClient.appId],
        boxReferences: [metadataBoxName, metadataBoxName]
      });
    })

    console.log(`Opening proposal ${proposalIds[i]}...`);
    await openGroup.send()
  } catch (e) {
    console.log(e);

    console.error("Failed to open proposal");

    process.exit(1);
  }
}

// Time warp to move proposals to the next phase
const ts = (await getLatestTimestamp()) + 86400 * 5;
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
    appReferences: [registryClient.appId],
    accountReferences: [adminAccount.addr],
    boxReferences: [metadataBoxName],
    extraFee: ALGORAND_MIN_TX_FEE.microAlgos(),
  });
}

// Set admin account as xGov Council to avoid having to click through admin panel
await registryClient.send.setXgovCouncil({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: [adminAccount.addr],
});

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

// get 4 random proposal IDs (excluding the first one)
const randomProposalIds = proposalIds.slice(1).sort(() => Math.random() - 0.5).slice(0, 4);

console.log(
  `To test the assignment endpoint, start the server by running:\n\n`,
  `npm run dev\n\n`,
  `get the server port from the console output (probably 4321), and then run:\n\n`,
  `curl -v -X POST http://localhost:4321/api/assign \\ \n -H "Content-Type: application/json" \\ \n -d '{"proposalIds": [${randomProposalIds}]}' \\ \n -s | jq '.'\n\n`,
  `then run:\n\n`,
  `curl -v -X POST http://localhost:4321/api/assign \\ \n -H "Content-Type: application/json" \\ \n -s | jq '.'\n\n`,
  `to assign the remaining proposals\n`,
)
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
          address: member.addr,
          votes: committeeVotes[index],
        };
      })
    },
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  ),
  "utf-8",
);
