/**
 * Postinstall script to build @algorandfoundation/liquid-client.
 *
 * The published package ships only TypeScript source and a `prepare` script
 * that runs `tsc`. The compilation fails under TypeScript >=5.7 due to:
 *   1. Uint8Array ↔ BufferSource incompatibility in assertion.ts
 *   2. Missing `v7` type export from uuid (uuid 10 has it at runtime)
 *
 * This script patches the two errors, then compiles the package.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const root = resolve("node_modules/@algorandfoundation/liquid-client");

// Skip if the package isn't installed (e.g. CI with --ignore-optional)
if (!existsSync(root)) {
  process.exit(0);
}

// Skip if already built
if (existsSync(resolve(root, "lib/index.js"))) {
  process.exit(0);
}

// Patch assertion.ts — cast Uint8Array to BufferSource
const assertionPath = resolve(root, "src/assertion.ts");
let assertion = readFileSync(assertionPath, "utf8");
assertion = assertion.replace(
  "decodedOptions.challenge = fromBase64Url(options.challenge as string);",
  "decodedOptions.challenge = fromBase64Url(options.challenge as string) as unknown as BufferSource;",
);
writeFileSync(assertionPath, assertion);

// Patch signal.ts — suppress uuid v7 type error
const signalPath = resolve(root, "src/signal.ts");
let signal = readFileSync(signalPath, "utf8");
if (!signal.includes("@ts-ignore")) {
  signal = signal.replace(
    "import { v7 as uuidv7 } from 'uuid';",
    "// @ts-ignore - uuid 10 has v7 but types may not reflect it\nimport { v7 as uuidv7 } from 'uuid';",
  );
  writeFileSync(signalPath, signal);
}

// Build
execSync("npx tsc", { cwd: root, stdio: "inherit" });
console.log("@algorandfoundation/liquid-client built successfully");
