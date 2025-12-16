import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";
import { readFileSync } from "fs";
import { committeeIdToSafeFileName } from "./utils";

const APP_ID = process.env.APP_ID ? BigInt(process.env.APP_ID) : 0n;

if (APP_ID === 0n) {
  throw new Error("APP_ID environment variable is not set");
}
// from env vars like ALGOD_SERVER etc
const algorand = AlgorandClient.fromEnvironment();

// get all xgovs from committee file
const { committee_id } = (await algorand.app.getGlobalState(APP_ID)) as unknown as { committee_id: { valueRaw: Uint8Array } }
const committeeSafeName: string = committeeIdToSafeFileName(
  Buffer.from(committee_id.valueRaw).toString("base64"),
);
const { xGovs } = JSON.parse(
  readFileSync(`../public/committees/${committeeSafeName}.json`).toString(),
);
const xGovAddresses = xGovs.map((xgov: { address: string }) => xgov.address);

console.log("Total addresses:", xGovAddresses.length);
console.log("Getting voted addresses");
const nonVoters = await getNonVoters(APP_ID);

console.log("Non-voting addresses:", nonVoters.length);

console.log("\nNon-voting addresses:");
for (const addr of nonVoters) {
  console.log(addr);
}

async function getNonVoters(appId: bigint): Promise<string[]> {
  const boxes = await algorand.client.algod
    .getApplicationBoxes(Number(appId))
    .do();

  let nonVoters: string[] = []
  boxes.boxes.map((box) => {
    if (new TextDecoder().decode(box.name).startsWith("V")) {
      const address = algosdk.encodeAddress(box.name.slice(1))
      nonVoters.push(address);
    }
  });

  return nonVoters
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
