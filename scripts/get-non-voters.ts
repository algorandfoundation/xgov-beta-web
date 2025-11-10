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
const voted = await getVoters(APP_ID);
const nonVoters = xGovAddresses.filter((addr: string) => !voted.includes(addr));

console.log("Voted addresses:", voted.length);
console.log("Non-voting addresses:", nonVoters.length);

console.log("\nNon-voting addresses:");
for (const addr of nonVoters) {
  console.log(addr);
}

async function getVoters(appId: bigint): Promise<string[]> {
  const boxes = await algorand.client.algod
    .getApplicationBoxes(Number(appId))
    .do();

  let voterBoxes: Uint8Array<ArrayBufferLike>[] = [];
  boxes.boxes.map((box) => {
    if (new TextDecoder().decode(box.name).startsWith("V")) {
      voterBoxes.push(box.name);
    }
  });

  let addresses: string[] = [];
  for (const boxName of voterBoxes) {
    process.stderr.write(".");
    const value = await algorand.app.getBoxValueFromABIType({
      appId: BigInt(appId),
      boxName: boxName,
      type: algosdk.ABIType.from("(uint64,bool)"),
    });

    if (Array.isArray(value) && value[1]) {
      const address = algosdk.encodeAddress(Buffer.from(boxName.slice(1)));
      addresses.push(address);
    }
    await sleep(50);
  }
  return addresses;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
