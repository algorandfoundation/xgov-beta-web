import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import algosdk, {
  makeBasicAccountTransactionSigner,
} from "algosdk";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { committeeIdToSafeFileName } from "./utils";
import {
  XGovRegistryClient,
} from "@algorandfoundation/xgov/registry";

/**
 * Script to simulate voting on testnet using a list of voter seed phrases and a specified vote distribution.
 * Each voter can vote "approve", "reject", "abstain", "boycott", or be "absent" (not vote).
 * The distribution of votes is determined by command line arguments, allowing for flexible testing of different scenarios.
 * 
 * Usage examples:
 *   - npm run testnet-vote -- 755062060 ~/Downloads/testnet-committee.tsv "40/30/10/10"
 *   - npm run testnet-vote --app-id 755062060 --seeds-file ~/Downloads/testnet-committee.tsv --distribution "approve:50,reject:30,abstain:10,boycott:10"
 *   - npm run testnet-vote -- 755062060 ~/Downloads/testnet-committee.tsv approve:70,reject:20,abstain:10
 */

type VoteType = "approve" | "reject" | "abstain" | "boycott" | "absent";

interface VoteDistribution {
  approve: number;
  reject: number;
  abstain: number;
  boycott: number;
}

/**
 * Parse vote distribution from command line argument.
 * Accepts formats like:
 *   - "yes" or "approve" -> 100% approve
 *   - "no" or "reject" -> 100% reject
 *   - "abstain" -> 100% abstain
 *   - "boycott" -> 100% boycott
 *   - "50/30/15/5" -> 50% approve, 30% reject, 15% abstain, 5% boycott
 *   - "approve:50,reject:30,abstain:15,boycott:5" -> same as above
 */
function parseVoteDistribution(arg: string | undefined): VoteDistribution {
  if (!arg || arg === "yes" || arg === "approve") {
    return { approve: 100, reject: 0, abstain: 0, boycott: 0 };
  }
  if (arg === "no" || arg === "reject") {
    return { approve: 0, reject: 100, abstain: 0, boycott: 0 };
  }
  if (arg === "abstain") {
    return { approve: 0, reject: 0, abstain: 100, boycott: 0 };
  }
  if (arg === "boycott") {
    return { approve: 0, reject: 0, abstain: 0, boycott: 100 };
  }

  // Try parsing as "50/30/15/5" format
  if (arg.includes("/")) {
    const parts = arg.split("/").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
      throw new Error(
        `Invalid distribution format: ${arg}. Use "50/30/15/5" for approve/reject/abstain/boycott percentages.`
      );
    }
    const [approve, reject, abstain, boycott] = parts;
    return { approve, reject, abstain, boycott };
  }

  // Try parsing as "approve:50,reject:30,abstain:15,boycott:5" format
  if (arg.includes(":")) {
    const distribution: VoteDistribution = { approve: 0, reject: 0, abstain: 0, boycott: 0 };
    const parts = arg.split(",");
    for (const part of parts) {
      const [key, value] = part.split(":");
      const voteKey = key.trim().toLowerCase() as keyof VoteDistribution;
      const percent = Number(value);
      if (isNaN(percent) || !(voteKey in distribution)) {
        throw new Error(
          `Invalid distribution part: ${part}. Use format "approve:50,reject:30,abstain:15,boycott:5".`
        );
      }
      distribution[voteKey] = percent;
    }
    return distribution;
  }

  throw new Error(
    `Unknown vote argument: ${arg}. Use "yes", "no", "abstain", "boycott", "50/30/15/5", or "approve:50,reject:30".`
  );
}

function validateDistribution(dist: VoteDistribution): void {
  const total = dist.approve + dist.reject + dist.abstain + dist.boycott;
  if (total > 100) {
    throw new Error(
      `Vote distribution must sum to 100% or less, got ${total}% (approve:${dist.approve}, reject:${dist.reject}, abstain:${dist.abstain}, boycott:${dist.boycott})`
    );
  }
  if (total < 100) {
    console.log(`Note: ${100 - total}% of voters will be absent (not vote)`);
  }
}

/**
 * Assign a vote type to a voter based on distribution percentages.
 * Uses the voter's index to deterministically assign vote types.
 * Returns "absent" if the voter falls outside the distribution (for testing absenteeism).
 */
function assignVoteType(voterIndex: number, totalVoters: number, dist: VoteDistribution): VoteType {
  // Calculate thresholds based on percentages
  const approveThreshold = Math.round((dist.approve / 100) * totalVoters);
  const rejectThreshold = approveThreshold + Math.round((dist.reject / 100) * totalVoters);
  const abstainThreshold = rejectThreshold + Math.round((dist.abstain / 100) * totalVoters);
  const boycottThreshold = abstainThreshold + Math.round((dist.boycott / 100) * totalVoters);
  
  if (voterIndex < approveThreshold) return "approve";
  if (voterIndex < rejectThreshold) return "reject";
  if (voterIndex < abstainThreshold) return "abstain";
  if (voterIndex < boycottThreshold) return "boycott";
  return "absent";
}

function getVoteAmounts(voteType: Exclude<VoteType, "absent">, votes: bigint): { approvalVotes: bigint; rejectionVotes: bigint } {
  switch (voteType) {
    case "approve":
      return { approvalVotes: votes, rejectionVotes: 0n };
    case "reject":
      return { approvalVotes: 0n, rejectionVotes: votes };
    case "abstain":
      return { approvalVotes: 0n, rejectionVotes: 0n };
    case "boycott":
      return { approvalVotes: votes, rejectionVotes: votes };
  }
}

const argv = await yargs(hideBin(process.argv))
  .usage("Usage: $0 [options] [app-id] [seeds-file] [distribution]")
  .option("app-id", {
    alias: "a",
    type: "number",
    description: "Proposal app ID",
  })
  .option("seeds-file", {
    alias: "s",
    type: "string",
    description: "File containing voter seed phrases (tab-separated: account, rekeyed?, seed)",
  })
  .option("distribution", {
    alias: "d",
    type: "string",
    description: "Vote distribution",
  })
  .example("$0 12345 seeds.txt", "100% approve (default)")
  .example("$0 --app-id 12345 --seeds-file seeds.txt", "Same as above with flags")
  .example("$0 12345 seeds.txt reject", "100% reject")
  .example("$0 -a 12345 -s seeds.txt -d 50/30/15/5", "50% approve, 30% reject, 15% abstain, 5% boycott")
  .example("$0 12345 seeds.txt approve:60,reject:40", "60% approve, 40% reject")
  .example("$0 12345 seeds.txt 80/0/0/0", "80% approve, 20% absent")
  .epilogue(
    "Vote distribution formats:\n" +
    '  - "yes" or "approve"     -> 100% approve\n' +
    '  - "no" or "reject"       -> 100% reject\n' +
    '  - "abstain"              -> 100% abstain\n' +
    '  - "boycott"              -> 100% boycott\n' +
    '  - "50/30/15/5"           -> approve/reject/abstain/boycott percentages\n' +
    '  - "approve:60,reject:40" -> named percentages (missing = 0%)\n' +
    '  - Sum < 100%             -> remaining voters are absent'
  )
  .help()
  .parseAsync();

// Support both flags and positional args (flags take precedence)
const appIdArg = argv.appId ?? argv._[0];
const seedsFileArg = argv.seedsFile ?? argv._[1] ?? (argv.appId ? argv._[0] : undefined);
const distributionArg = argv.distribution ?? argv._[2] ?? (argv.appId && argv.seedsFile ? argv._[0] : argv.appId || argv.seedsFile ? argv._[1] : undefined);

if (!appIdArg) {
  throw new Error("app-id is required. Provide as first positional argument or with --app-id flag.");
}

if (!seedsFileArg) {
  throw new Error("seeds-file is required. Provide as second positional argument or with --seeds-file flag.");
}

const APP_ID = BigInt(appIdArg);
const voterSeedsFilename = String(seedsFileArg);
const voteDistribution = parseVoteDistribution(distributionArg as string | undefined);
validateDistribution(voteDistribution);

console.log("Parsing seeds");
const voters: algosdk.Account[] = readFileSync(voterSeedsFilename, "utf8")
  .split("\n")
  .filter((line) => line.trim().length > 0)
  .flatMap((line) => {
    process.stderr.write(".");
    // Handle 3-column format: account, rekeyed?, seed
    const columns = line.split("\t");
    if (columns.length >= 3) {
      const [_account, rekeyed, seed] = columns;
      // Skip rekeyed accounts (only process if rekeyed === 'no')
      if (rekeyed.trim().toLowerCase() !== "no") {
        return [];
      }
      const { addr, sk } = algosdk.mnemonicToSecretKey(seed.trim());
      return [{ addr, sk }];
    }
    // Fallback: treat entire line as seed phrase
    const { addr, sk } = algosdk.mnemonicToSecretKey(line.trim());
    return [{ addr, sk }];
  });

console.log("");

// from env vars like ALGOD_SERVER etc
const algorand = AlgorandClient.testNet();

console.log("Getting registry app ID");
// get all xgovs from committee file
const {
  committee_id,
  registry_app_id: { value: registryAppId },
} = (await algorand.app.getGlobalState(APP_ID)) as unknown as {
  committee_id: { valueRaw: Uint8Array };
  registry_app_id: { value: bigint };
};

const registryClient = algorand.client.getTypedAppClientById(
  XGovRegistryClient,
  { appId: registryAppId },
);

console.log("Loading committee file");
const committeeSafeName: string = committeeIdToSafeFileName(
  Buffer.from(committee_id.valueRaw).toString("base64"),
);
const committeeFilePath = join(__dirname, "..", "public", "committees", `${committeeSafeName}.json`);
const { xGovs } = JSON.parse(
  readFileSync(committeeFilePath).toString(),
);

// Filter to only voters that are xGovs
const eligibleVoters = voters.filter(voter => 
  xGovs.find((xgov: { address: string }) => xgov.address === voter.addr.toString())
);

console.log(`\nVote distribution: ${JSON.stringify(voteDistribution)}`);
console.log(`Eligible voters: ${eligibleVoters.length}`);
const voteCounts = { approve: 0, reject: 0, abstain: 0, boycott: 0, absent: 0 };

console.log("\nVoting...");
for (let i = 0; i < voters.length; i++) {
  const voter = voters[i];
  const xGov = xGovs.find((xgov: { address: string }) => xgov.address === voter.addr.toString());
  if (!xGov) continue;
  
  const voterIndex = eligibleVoters.indexOf(voter);
  const voteType = assignVoteType(voterIndex, eligibleVoters.length, voteDistribution);
  voteCounts[voteType]++;
  
  if (voteType === "absent") {
    console.log(`Skipping voter ${voter.addr.toString()} (absent)`);
    continue;
  }
  
  const { votes } = xGov;
  const signer = makeBasicAccountTransactionSigner(voter);
  try {
    await vote({
      appId: APP_ID,
      votes: BigInt(votes),
      voteType,
      activeAddress: voter.addr.toString(),
      transactionSigner: signer,
    });
  } catch (e) {
    console.error(
      `Error voting for proposal ${APP_ID} with ${votes} votes: ${e}`,
    );
  }
}

console.log(`\nFinal vote counts: ${JSON.stringify(voteCounts)}`);

async function vote({
  appId,
  votes,
  voteType,
  activeAddress,
  transactionSigner,
}: {
  appId: bigint;
  votes: bigint;
  voteType: Exclude<VoteType, "absent">;
  activeAddress: string;
  transactionSigner: algosdk.TransactionSigner;
}) {
  const { approvalVotes, rejectionVotes } = getVoteAmounts(voteType, votes);
  
  console.log(
    `Voting ${voteType} for proposal ${appId} from ${activeAddress} (${votes} votes -> approve:${approvalVotes}, reject:${rejectionVotes})`,
  );
  const res = await registryClient.send.voteProposal({
    sender: activeAddress,
    signer: transactionSigner,
    args: {
      proposalId: appId,
      xgovAddress: activeAddress,
      approvalVotes,
      rejectionVotes,
    },
    appReferences: [appId],
    accountReferences: [activeAddress],
    boxReferences: [
      xGovBoxName(activeAddress),
      { appId: appId, name: voterBoxName(activeAddress) },
    ],
    extraFee: (1000).microAlgos(),
  });
  console.log(
    `Voted for proposal ${appId} from ${activeAddress} with ${votes} votes: ${res.txIds[0]}`,
  );
}

function xGovBoxName(address: string): Uint8Array {
  return new Uint8Array(
    Buffer.concat([Buffer.from("x"), algosdk.decodeAddress(address).publicKey]),
  );
}

function voterBoxName(address: string): Uint8Array {
  const addr = algosdk.decodeAddress(address).publicKey;
  return new Uint8Array(Buffer.concat([Buffer.from("V"), addr]));
}
