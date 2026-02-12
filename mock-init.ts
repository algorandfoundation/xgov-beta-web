import fs from "node:fs";
import crypto from "crypto";
import algosdk from "algosdk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { XGovRegistryFactory } from "@algorandfoundation/xgov/registry";
import { CouncilFactory } from "@algorandfoundation/xgov/council";
import type { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account";
import { algorand } from "@/api/algorand";
import { ProposalFactory } from "@algorandfoundation/xgov";
import { ProposalStatus as PS } from "@/api/types";
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
import { CouncilMemberBoxName, CouncilVoteBoxName } from "@/api/council";

const MAX_APP_TOTAL_ARG_LEN = 2048
const METHOD_SELECTOR_LENGTH = 4
const UINT64_LENGTH = 8
const DYNAMIC_BYTE_ARRAY_LENGTH_OVERHEAD = 4

function committeeIdToSafeFileName(committeeId: Buffer): string {
  return committeeId
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function loadProposalContractDataSizePerTransaction() {
  return (
    MAX_APP_TOTAL_ARG_LEN
    - METHOD_SELECTOR_LENGTH
    - UINT64_LENGTH
    - DYNAMIC_BYTE_ARRAY_LENGTH_OVERHEAD
  )
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

// Parse command-line arguments
const argv = await yargs(hideBin(process.argv))
  .option('council-address', {
    alias: 'c',
    type: 'string',
    description: 'Algorand address to be added to the council for testing',
    demandOption: true,
  })
  .help()
  .parseAsync();

const councilTestingAddress = argv.councilAddress;
console.log('Council testing address:', councilTestingAddress);

algorand.setSuggestedParamsCacheTimeout(0);
// Generate admin account (the one that creates the registry)
const fundAmount = (10).algo();
const adminAccount = await algorand.account.fromKmd(
  "unencrypted-default-wallet",
);
console.log("admin account", adminAccount.addr);
const dispenser = await algorand.account.dispenserFromEnvironment();
const daemonAddress = algorand.account.random()

// Reuse suggested params throughout this script
const suggestedParams = await algorand.getSuggestedParams();

await algorand.account.ensureFunded(adminAccount.addr, dispenser, fundAmount);
await algorand.account.ensureFunded(councilTestingAddress, dispenser, (200).algo());
await algorand.account.ensureFunded(daemonAddress.addr, dispenser, fundAmount);

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

// proposal_factory = algorand_client.client.get_typed_app_factory(
//     typed_factory=ProposalFactory,
// )

// compiled_proposal = proposal_factory.app_factory.compile()
// client.send.init_proposal_contract(args=(len(compiled_proposal.approval_program),))
// data_size_per_transaction = load_proposal_contract_data_size_per_transaction()
// bulks = 1 + len(compiled_proposal.approval_program) // data_size_per_transaction
// for i in range(bulks):
//     chunk = compiled_proposal.approval_program[
//         i * data_size_per_transaction : (i + 1) * data_size_per_transaction
//     ]
//     client.send.load_proposal_contract(
//         args=(i * data_size_per_transaction, chunk),
//     )

const proposalMinter = new ProposalFactory({
  algorand,
  defaultSender: adminAccount.addr,
  defaultSigner: adminAccount.signer,
});

const compiledProposal = await proposalMinter.appFactory.compile();
const size = compiledProposal.approvalProgram.length;
const dataSizePerTransaction = loadProposalContractDataSizePerTransaction();
const bulks = 1 + Math.floor(size / dataSizePerTransaction);

await registryClient.send.initProposalContract({ args: { size }});

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

await registryClient.send.setXgovSubscriber({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    subscriber: adminAccount.addr.toString(),
  },
});

const councilMinter = new CouncilFactory({
  algorand,
  defaultSender: adminAccount.addr,
  defaultSigner: adminAccount.signer,
});

const councilResults = await councilMinter.send.create.create({
  args: {
    registryId: registryClient.appId,
  }
});

const councilClient = councilResults.appClient;

await councilClient.appClient.fundAppAccount({
  sender: dispenser.addr,
  amount: (100).algos(),
});

await councilClient.send.addMember({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    address: councilTestingAddress,
  }
});

let councilMembers = []

for (let i = 0; i < 10; i++) {
  const randomAccount = algorand.account.random();

  console.log('council member', randomAccount.addr);

  await algorand.account.ensureFunded(
    randomAccount.addr,
    dispenser,
    (1).algo(),
  );

  await councilClient.send.addMember({
    sender: adminAccount.addr,
    signer: adminAccount.signer,
    args: {
      address: randomAccount.addr.toString(),
    }
  });

  councilMembers.push(randomAccount);
}

await registryClient.send.setXgovCouncil({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: [councilClient.appAddress.toString()],
})

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

for (let i = 0; i < 100; i++) {
  const randomAccount = algorand.account.random();
  console.log('committee member', randomAccount.addr);
  committeeMembers.push(randomAccount);
  // Ensure votingPower is always at least 1
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

await registryClient.send.declareCommittee({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    committeeId: new Uint8Array(Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')),
    size: committeeMembers.length,
    votes: committeeVotesSum,
  },
})

// Create a deterministic localnet committee file matching the mocked committeeId.
// The web app uses `committeeIdToSafeFileName(committeeId)` as the lookup key.
const committeeId = Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
const safeCommitteeId = committeeIdToSafeFileName(committeeId);
const committeesDir = './public/committees';
fs.mkdirSync(committeesDir, { recursive: true });

const committeeFile = {
  networkGenesisHash: suggestedParams.genesisHash,
  periodStart: 0,
  periodEnd: 1_000_000,
  registryId: Number(registryClient.appId),
  totalMembers: committeeMembers.length,
  totalVotes: committeeVotesSum,
  xGovs: [
    ...committeeMembers.map((m, idx) => ({ address: m.addr.toString(), votes: committeeVotes[idx] })),
  ].sort((a, b) => a.address.localeCompare(b.address)),
};

fs.writeFileSync(
  `${committeesDir}/${safeCommitteeId}.json`,
  JSON.stringify(committeeFile, null, 2),
  'utf-8',
);

// Generate and setup mock proposer accounts
const proposerAccounts: (TransactionSignerAccount & {
  account: algosdk.Account;
})[] = [];
const proposalIds: bigint[] = [];
const proposerFee = PROPOSER_FEE.microAlgo();
const proposalFee = PROPOSAL_FEE.microAlgo();

const oneYearFromNow = (await getLatestTimestamp()) + 365n * 24n * 60n * 60n;

const proposalFactory = new ProposalFactory({ algorand });

const metadataBoxName = new Uint8Array(Buffer.from("M"))

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
      },
    });
  } catch (e) {
    console.error("Failed to approve proposer KYC");
    process.exit(1);
  }

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
    extraFee: (2000).microAlgos(),
  });

  // Store proposal ID if available
  if (!result.return) {
    console.error("Proposal creation failed");
    process.exit(1);
  }

  console.log(`\nNew Proposal: ${result.return}\n`);

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
    Number((mockProposals[i].requestedAmount.algos().microAlgos * PROPOSAL_COMMITMENT_BPS) / BigInt(10_000)),
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
        }
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

    await openGroup.send()
  } catch (e) {
    console.log(e);

    console.error("Failed to open proposal");

    process.exit(1);
  }
}

const ts = (await getLatestTimestamp()) + 86400n * 5n;
await timeWarp(ts);
console.log("finished time warp, new ts: ", await getLatestTimestamp());

// Let's submit all proposals except the first one, owned by admin
for (let i = 1; i < mockProposals.length; i++) {
  const proposalClient = proposalFactory.getAppClientById({
    appId: proposalIds[i],
  });

  await proposalClient.send.submit({
    sender: proposerAccounts[i].addr,
    signer: proposerAccounts[i].signer,
    args: {},
    extraFee: (1000).microAlgos(),
  });
}


for (let i = 1; i < mockProposals.length; i++) {
  const proposal = mockProposals[i];
  if (proposal.status === PS.ProposalStatusVoting) {

    console.log(`Proposal ${i}`);

    const proposalClient = proposalFactory.getAppClientById({ appId: proposalIds[i] });

    for (let j = 0; j < committeeMembers.length; j++) {
      const committeeMember = committeeMembers[j];
      const votes = committeeVotes[j];

      const addr = committeeMember.addr.publicKey;

      console.log('Committee member: ', committeeMember.addr);
      console.log('    voting power: ', votes);
      console.log('           index: ', j);

      try {
        await proposalClient.send.assignVoters({
          sender: adminAccount.addr,
          signer: adminAccount.signer,
          args: {
            voters: [[committeeMember.addr.toString(), votes]],
          }
        })
        console.log('assigned voter');
      } catch (e) {
        console.error('Failed to assign voter');
        process.exit(1);
      }
    }
  }
}

console.log('Finished voter assignment');

for (let i = 1; i < 10; i++) {

  let randomCutOff = Math.random() * committeeMembers.length
  if (i === 1) {
    randomCutOff = committeeMembers.length - 1
  }

  const lean = Math.random()

  for (let j = 1; j < committeeMembers.length; j++) {
    if (j > randomCutOff) {
      break;
    }

    const potentialVotingPower = committeeVotes[j]
    const actualVotingPower = Number(Math.floor(Math.random() * potentialVotingPower));

    let approve = Math.random() > lean
    if (i === 1) {
      approve = true
    }

    await registryClient.send.voteProposal({
      sender: committeeMembers[j].addr,
      signer: committeeMembers[j].signer,
      args: {
        proposalId: proposalIds[i],
        xgovAddress: committeeMembers[j].addr.toString(),
        approvalVotes: approve ? actualVotingPower : 0n,
        rejectionVotes: approve ? 0n : actualVotingPower,
      },
      extraFee: (100_000).microAlgos(),
    })
  }
}

// For one proposal, we will have a voting period
// to make it reviewable by xGov Council
// Send votes for proposal #0 from admin account
try {
  await registryClient.send.voteProposal({
    sender: adminAccount.addr,
    signer: adminAccount.signer,
    args: {
      proposalId: proposalIds[1],
      xgovAddress: adminAccount.addr.toString(),
      approvalVotes: 10n,
      rejectionVotes: 0n,
    },
    extraFee: (100_000).microAlgos(),
  });
} catch (e) {
  console.error("Failed to vote proposal");
  process.exit(1);
}

// Scrutinize proposal #0's voting
await proposalFactory
  .getAppClientById({ appId: proposalIds[1] })
  .send.scrutiny({
    sender: adminAccount.addr,
    signer: adminAccount.signer,
    args: {},
    extraFee: (1000).microAlgo()
  })

for (let i = 0; i < councilMembers.length; i++) {
  await councilClient.send.vote({
    sender: councilMembers[i].addr,
    signer: councilMembers[i].signer,
    args: {
      proposalId: proposalIds[1],
      block: i < 5 ? true : false,
    },
    extraFee: (1_000).microAlgo()
  })
}

await registryClient.send.setXgovDaemon({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    xgovDaemon: daemonAddress.addr.toString(),
  },
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
);
const envFile = fs.readFileSync("./.env.template", "utf-8");
fs.writeFileSync(
  ".env.development",
  envFile.replace(
    "<REPLACE_WITH_REGISTRY_APP_ID>",
    results.appClient.appId.toString(),
  ).replace(
    "<REPLACE_WITH_COUNCIL_APP_ID>",
    councilClient.appId.toString()
  ).replace(
    "<REPLACE_WITH_DAEMON_MNEMONIC>",
    algosdk.secretKeyToMnemonic(daemonAddress.account.sk)
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
    },
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  ),
  "utf-8",
);
