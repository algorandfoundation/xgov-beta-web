import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import algosdk, {
  makeBasicAccountTransactionSigner,
} from "algosdk";
import { readFileSync } from "fs";
import { committeeIdToSafeFileName } from "./utils";
import {
  XGovRegistryClient,
} from "@algorandfoundation/xgov/registry";
import { act } from "react";

const APP_ID = process.env.APP_ID ? BigInt(process.env.APP_ID) : 0n;
const voterSeedsFilename = process.argv[2];

if (APP_ID === 0n) {
  throw new Error("APP_ID environment variable is not set");
}

if (!voterSeedsFilename) {
  throw new Error(
    "Please provide voter seeds filename as a command line argument. The file should have the seed phrases of the testnet xGovs separated by newlines.",
  );
}

console.log("Parsing seeds");
const voters = Object.fromEntries(
  readFileSync(voterSeedsFilename, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      process.stderr.write(".");
      const { addr, sk } = algosdk.mnemonicToSecretKey(line);
      return [addr, sk];
    }),
);
console.log("");

// from env vars like ALGOD_SERVER etc
const algorand = AlgorandClient.fromEnvironment();

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
const { xGovs } = JSON.parse(
  readFileSync(`../public/committees/${committeeSafeName}.json`).toString(),
);

console.log("Voting")
for (const [addr, sk] of Object.entries(voters)) {
  const xGov = xGovs.find((xgov: { address: string }) => xgov.address === addr);
  if (!xGov) continue;
  const { votes } = xGov;
  const signer = makeBasicAccountTransactionSigner({ addr, sk });
  try {
    await vote({
      appId: APP_ID,
      votes: BigInt(votes),
      activeAddress: addr,
      transactionSigner: signer,
    });
  } catch (e) {
    console.error(
      `Error voting for proposal ${APP_ID} with ${votes} votes: ${e}`,
    );
  }
}

async function vote({
  appId,
  votes,
  activeAddress,
  transactionSigner,
}: {
  appId: bigint;
  votes: bigint;
  activeAddress: string;
  transactionSigner: algosdk.TransactionSigner;
}) {
  console.log(
    `Voting for proposal ${appId} from ${activeAddress} with ${votes}`,
  );
  const res = await registryClient.send.voteProposal({
    sender: activeAddress,
    signer: transactionSigner,
    args: {
      proposalId: appId,
      xgovAddress: activeAddress,
      approvalVotes: votes,
      rejectionVotes: 0n,
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
