import { sha512_256 } from "js-sha512";
import { readFileSync } from "fs";
import Ajv from "ajv";
import { isDeepStrictEqual } from "util";
import { committeeIdToSafeFileName } from "./utils";

let errors = false;
const filename = process.argv[2];

if (!filename) throw new Error("No filename provided");

const contents = readFileSync(filename);

const jsonContents = JSON.parse(contents.toString());
const schema = JSON.parse(readFileSync("./committee-schema.json").toString());

const ajv = new Ajv();
const validate = ajv.compile(schema);

const valid = validate(jsonContents);
if (valid) {
  console.log("Schema validation OK");
} else {
  console.warn("Schema validation errors:");
  console.warn(validate.errors);
  errors = true;
}

const actualSort = jsonContents.xGovs.map(
  ({ address: a }: { address: string }) => a,
);
const expectedSort = [...actualSort].sort();

if (!isDeepStrictEqual(actualSort, expectedSort)) {
  console.warn("Validation error: xGov array not sorted!");
  errors = true;
} else {
  console.warn("xGov array is sorted");
}

const fileHash = Buffer.from(sha512_256(contents), "hex");
const concatenated = Buffer.concat([Buffer.from("arc0086"), fileHash]);
const committeeId = Buffer.from(sha512_256(concatenated), "hex").toString(
  "base64",
);

const size = jsonContents.xGovs.length;
const votes = jsonContents.xGovs.reduce(
  (total: number, { votes }: { votes: number }) => total + votes,
  0,
);

console.log("Committee ID:", committeeId);
console.log("Safe mode:", committeeIdToSafeFileName(committeeId));
console.log("Size:", size);
console.log("Total power:", votes);

if (errors) {
  console.warn("ERR - Some errors were reported");
  process.exit(1);
}
