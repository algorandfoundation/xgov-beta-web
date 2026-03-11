import nacl from "tweetnacl";
import { decodeAddress } from "algosdk";

/**
 * SIWA (Sign In With Algorand) challenge structure.
 * Lute wallet requires this format for signData (ARC-60).
 *
 * Custom application data is embedded in standard SIWA fields:
 *   - nonce: SHA-256 hex digest of the content being signed
 *   - resources: array containing the action identifier
 */
export interface SiwaChallenge {
  domain: string;
  chain_id: string;
  account_address: string;
  type: "ed25519";
  statement: string;
  uri: string;
  version: string;
  nonce: string;
  "issued-at": string;
  resources: string[];
}

export interface Arc60SignaturePayload {
  /** Base64-encoded canonical SIWA JSON (what was sent to the wallet). */
  challenge: string;
  signature: string; // base64
  signer: string; // base64
  domain: string;
  authenticatorData: string; // base64
}

/** SHA-256 hex digest using Web Crypto API (works in browser + CF Workers). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 raw bytes using Web Crypto API. */
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>);
  return new Uint8Array(hash);
}

/**
 * Build a SIWA challenge for terms update signing.
 * Returns the canonical JSON string (not yet base64-encoded).
 */
export function buildTermsUpdateChallenge(
  address: string,
  contentHash: string,
  origin: string,
): string {
  const challenge: SiwaChallenge = {
    domain: new URL(origin).host,
    chain_id: "283",
    account_address: address,
    type: "ed25519",
    statement: "Update xGov terms and conditions",
    uri: origin,
    version: "1",
    nonce: contentHash,
    "issued-at": new Date().toISOString(),
    resources: ["update-terms"],
  };
  // Canonical JSON: keys sorted alphabetically (RFC 8785)
  return JSON.stringify(challenge, Object.keys(challenge).sort());
}

const CHALLENGE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify an ARC-60 SIWA signature for a terms update.
 *
 * The signed message follows the Lute / use-wallet convention:
 *   SHA256(challengeJson) || SHA256(authenticatorData)
 *
 * Returns `{ valid: true }` or `{ valid: false, reason: string }`.
 */
export async function verifyTermsUpdateSignature(
  payload: Arc60SignaturePayload,
  expectedAddress: string,
  content: string,
): Promise<{ valid: true } | { valid: false; reason: string }> {
  try {
    // Decode base64 fields
    const signature = base64ToUint8Array(payload.signature);
    const signer = base64ToUint8Array(payload.signer);
    const authenticatorData = base64ToUint8Array(payload.authenticatorData);

    // The challenge field is base64-encoded per ARC-60; decode to get JSON.
    let challengeJson: string;
    let challenge: SiwaChallenge;
    try {
      challengeJson = atob(payload.challenge);
      challenge = JSON.parse(challengeJson);
    } catch {
      return { valid: false, reason: "Invalid challenge JSON" };
    }

    if (!challenge.resources?.includes("update-terms")) {
      return { valid: false, reason: "Invalid challenge action" };
    }

    if (challenge.account_address !== expectedAddress) {
      return { valid: false, reason: "Challenge address mismatch" };
    }

    // Validate timestamp window
    const issuedAt = new Date(challenge["issued-at"]).getTime();
    if (Number.isNaN(issuedAt)) {
      return { valid: false, reason: "Invalid issued-at timestamp" };
    }
    const age = Date.now() - issuedAt;
    if (age < 0 || age > CHALLENGE_MAX_AGE_MS) {
      return { valid: false, reason: "Challenge expired or future timestamp" };
    }

    // Verify content hash stored in nonce matches SHA-256 of actual content
    const expectedHash = await sha256Hex(content);
    if (challenge.nonce !== expectedHash) {
      return { valid: false, reason: "Content hash mismatch" };
    }

    // Verify signer public key matches the expected address
    const expectedPublicKey = decodeAddress(expectedAddress).publicKey;
    if (!uint8ArraysEqual(signer, expectedPublicKey)) {
      return { valid: false, reason: "Signer does not match expected address" };
    }

    // Verify domain integrity: SHA256(domain) === authenticatorData[0:32]
    const domainHash = await sha256(new TextEncoder().encode(payload.domain));
    const authDataDomainHash = authenticatorData.slice(0, 32);
    if (!uint8ArraysEqual(domainHash, authDataDomainHash)) {
      return { valid: false, reason: "Domain integrity check failed" };
    }

    // Reconstruct the signed message per Lute/use-wallet convention:
    //   SHA256(challengeJson) || SHA256(authenticatorData)
    const clientDataHash = await sha256(
      new TextEncoder().encode(challengeJson),
    );
    const authDataHash = await sha256(authenticatorData);
    const message = new Uint8Array(64);
    message.set(clientDataHash, 0);
    message.set(authDataHash, 32);

    // Verify Ed25519 signature
    if (!nacl.sign.detached.verify(message, signature, signer)) {
      return { valid: false, reason: "Ed25519 signature verification failed" };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason:
        error instanceof Error ? error.message : "Signature verification error",
    };
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
