import nacl from "tweetnacl";
import { decodeAddress } from "algosdk";

export interface TermsUpdateChallenge {
  action: "update-terms";
  address: string;
  contentHash: string;
  timestamp: number;
}

export interface Arc60SignaturePayload {
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
async function sha256(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

/** Build a challenge JSON string for terms update signing. */
export function buildTermsUpdateChallenge(
  address: string,
  contentHash: string,
): string {
  const challenge: TermsUpdateChallenge = {
    action: "update-terms",
    address,
    contentHash,
    timestamp: Date.now(),
  };
  return JSON.stringify(challenge);
}

const CHALLENGE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify an ARC-60 signature for a terms update.
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

    // Parse and validate challenge
    let challenge: TermsUpdateChallenge;
    try {
      challenge = JSON.parse(payload.challenge);
    } catch {
      return { valid: false, reason: "Invalid challenge JSON" };
    }

    if (challenge.action !== "update-terms") {
      return { valid: false, reason: "Invalid challenge action" };
    }

    if (challenge.address !== expectedAddress) {
      return { valid: false, reason: "Challenge address mismatch" };
    }

    // Validate timestamp window
    const age = Date.now() - challenge.timestamp;
    if (age < 0 || age > CHALLENGE_MAX_AGE_MS) {
      return { valid: false, reason: "Challenge expired or future timestamp" };
    }

    // Verify contentHash matches SHA-256 of actual content
    const expectedHash = await sha256Hex(content);
    if (challenge.contentHash !== expectedHash) {
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

    // Reconstruct the signed message: SHA256(challenge) || authenticatorData
    const challengeHash = await sha256(
      new TextEncoder().encode(payload.challenge),
    );
    const message = new Uint8Array(
      challengeHash.length + authenticatorData.length,
    );
    message.set(challengeHash, 0);
    message.set(authenticatorData, challengeHash.length);

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
