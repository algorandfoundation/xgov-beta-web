import fs from "node:fs";
import crypto from "crypto";
import algosdk, { ALGORAND_MIN_TX_FEE } from "algosdk";
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
import { CouncilMemberBoxName } from "@/api/council";

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

await algorand.account.ensureFunded('KFLCTKV2ELKPWXPS6IS6AH3QBNA77DGSPLW3O2WT7YOLJBBLZ72S6K52EM', dispenser, (200).algo());

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

await registryClient.send.initProposalContract({
  args: { size },
  boxReferences: [
    proposalApprovalBoxName(),
    proposalApprovalBoxName(),
    proposalApprovalBoxName(),
    proposalApprovalBoxName()
  ]
});

for (let i = 0; i < bulks; i++) {
  const chunk = compiledProposal.approvalProgram.slice(
    i * dataSizePerTransaction,
    (i + 1) * dataSizePerTransaction,
  );

  await registryClient.send.loadProposalContract({
    args: {
      offset: (i * dataSizePerTransaction),
      data: chunk,
    },
    boxReferences: [
      proposalApprovalBoxName(),
      proposalApprovalBoxName(),
      proposalApprovalBoxName(),
      proposalApprovalBoxName()
    ],
  });
}

const councilMinter = new CouncilFactory({
  algorand,
  defaultSender: adminAccount.addr,
  defaultSigner: adminAccount.signer,
});

const councilResults = await councilMinter.send.create.create({
  args: {
    admin: adminAccount.addr,
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
    address: 'KFLCTKV2ELKPWXPS6IS6AH3QBNA77DGSPLW3O2WT7YOLJBBLZ72S6K52EM',
  },
  boxReferences: [
    CouncilMemberBoxName('KFLCTKV2ELKPWXPS6IS6AH3QBNA77DGSPLW3O2WT7YOLJBBLZ72S6K52EM')
  ]
});

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
      address: randomAccount.addr,
    },
    boxReferences: [
      CouncilMemberBoxName(randomAccount.addr)
    ]
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

await registryClient.send.setXgovSubscriber({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    subscriber: adminAccount.addr,
  },
});

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
  const votingPower = Math.floor(Math.random() * 1_000);
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

await registryClient.send.declareCommittee({
  sender: adminAccount.addr,
  signer: adminAccount.signer,
  args: {
    committeeId: new Uint8Array(Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')),
    size: committeeMembers.length,
    votes: committeeVotesSum,
  },
})

// Generate and setup mock proposer accounts
const proposerAccounts: (TransactionSignerAccount & {
  account: algosdk.Account;
})[] = [];
const proposalIds: bigint[] = [];
const proposerFee = PROPOSER_FEE.microAlgo();
const proposalFee = PROPOSAL_FEE.microAlgo();

// get suggestedparams
const suggestedParams = await algorand.getSuggestedParams();

const oneYearFromNow = (await getLatestTimestamp()) + 365 * 24 * 60 * 60;

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
    boxReferences: [
      proposerBoxName(account.addr),
      proposalApprovalBoxName(),
      proposalApprovalBoxName(),
      proposalApprovalBoxName(),
      proposalApprovalBoxName(),
    ],
    extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
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

    await openGroup.send()
  } catch (e) {
    console.log(e);

    console.error("Failed to open proposal");

    process.exit(1);
  }
}

const ts = (await getLatestTimestamp()) + 86400 * 5;
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
    appReferences: [registryClient.appId],
    accountReferences: [adminAccount.addr],
    boxReferences: [metadataBoxName],
    extraFee: ALGORAND_MIN_TX_FEE.microAlgos(),
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

      const addr = algosdk.decodeAddress(committeeMember.addr).publicKey;

      console.log('Committee member: ', committeeMember.addr);
      console.log('    voting power: ', votes);
      console.log('           index: ', j);

      try {
        await proposalClient.send.assignVoters({
          sender: adminAccount.addr,
          signer: adminAccount.signer,
          args: {
            voters: [[committeeMember.addr, votes]],
          },
          appReferences: [registryClient.appId],
          boxReferences: [
            new Uint8Array(Buffer.concat([
              Buffer.from('V'),
              addr,
            ])),
          ]
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
        xgovAddress: committeeMembers[j].addr,
        approvalVotes: approve ? actualVotingPower : 0n,
        rejectionVotes: approve ? 0n : actualVotingPower,
      },
      accountReferences: [committeeMembers[j].addr],
      appReferences: [proposalIds[i]],
      boxReferences: [
        new Uint8Array(Buffer.concat([Buffer.from('x'), algosdk.decodeAddress(committeeMembers[j].addr).publicKey])),
        {
          appId: proposalIds[i], name: new Uint8Array(Buffer.concat([Buffer.from('V'),
          algosdk.decodeAddress(committeeMembers[j].addr).publicKey]))
        }],
      extraFee: (ALGORAND_MIN_TX_FEE * 100).microAlgos(),
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
      xgovAddress: adminAccount.addr,
      approvalVotes: 10n,
      rejectionVotes: 0n,
    },
    accountReferences: [adminAccount.addr],
    appReferences: [proposalIds[1]],
    boxReferences: [
      xGovBoxName(adminAccount.addr),
      {
        appId: proposalIds[1],
        name: new Uint8Array(
          Buffer.concat([
            Buffer.from("V"),
            algosdk.decodeAddress(adminAccount.addr).publicKey,
          ]),
        ),
      },
    ],
    extraFee: (ALGORAND_MIN_TX_FEE * 100).microAlgos(),
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
    appReferences: [registryClient.appId],
    accountReferences: [proposerAccounts[1].addr],
    extraFee: (1000).microAlgo()
  })

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
