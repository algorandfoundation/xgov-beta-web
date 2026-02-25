import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import { encodeAddress } from "algosdk";
import {
  sha256Hex,
  verifyTermsUpdateSignature,
  type Arc60SignaturePayload,
  type TermsUpdateChallenge,
} from "./arc60";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function sha256(
  data: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

/** Build a fully valid ARC-60 payload for testing. */
async function buildValidPayload(
  keypair: nacl.SignKeyPair,
  content: string,
  overrides?: {
    challenge?: Partial<TermsUpdateChallenge>;
    domain?: string;
  },
): Promise<{ payload: Arc60SignaturePayload; address: string }> {
  const address = encodeAddress(keypair.publicKey);
  const contentHash = await sha256Hex(content);
  const domain = overrides?.domain ?? "xgov.algorand.foundation";

  const challenge: TermsUpdateChallenge = {
    action: "update-terms",
    address,
    contentHash,
    timestamp: Date.now(),
    ...overrides?.challenge,
  };
  const challengeJson = JSON.stringify(challenge);

  // authenticatorData = SHA256(domain) || (optional extra bytes)
  const domainHash = await sha256(new TextEncoder().encode(domain));
  const authenticatorData = domainHash; // minimal: just the 32-byte domain hash

  // signed message = SHA256(challenge) || authenticatorData
  const challengeHash = await sha256(new TextEncoder().encode(challengeJson));
  const message = new Uint8Array(
    challengeHash.length + authenticatorData.length,
  );
  message.set(challengeHash, 0);
  message.set(authenticatorData, challengeHash.length);

  const signature = nacl.sign.detached(message, keypair.secretKey);

  return {
    address,
    payload: {
      challenge: challengeJson,
      signature: uint8ArrayToBase64(signature),
      signer: uint8ArrayToBase64(keypair.publicKey),
      domain,
      authenticatorData: uint8ArrayToBase64(authenticatorData),
    },
  };
}

describe("sha256Hex", () => {
  it("produces correct hash for known test vector", async () => {
    // SHA-256("hello") is well-known
    const result = await sha256Hex("hello");
    expect(result).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});

describe("verifyTermsUpdateSignature", () => {
  const content = "# Terms and Conditions\n\nYou agree to be excellent.";
  const keypair = nacl.sign.keyPair();

  it("accepts a valid signature", async () => {
    const { payload, address } = await buildValidPayload(keypair, content);
    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({ valid: true });
  });

  it("rejects wrong action", async () => {
    const { payload, address } = await buildValidPayload(keypair, content, {
      challenge: { action: "other" as "update-terms" },
    });
    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Invalid challenge action",
    });
  });

  it("rejects address mismatch in challenge", async () => {
    const otherKeypair = nacl.sign.keyPair();
    const otherAddress = encodeAddress(otherKeypair.publicKey);
    const { payload } = await buildValidPayload(keypair, content, {
      challenge: { address: otherAddress },
    });
    // expectedAddress is the original keypair's address, but challenge has otherAddress
    const address = encodeAddress(keypair.publicKey);
    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Challenge address mismatch",
    });
  });

  it("rejects expired timestamp", async () => {
    const { payload, address } = await buildValidPayload(keypair, content, {
      challenge: { timestamp: Date.now() - 6 * 60 * 1000 }, // 6 min ago
    });
    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Challenge expired or future timestamp",
    });
  });

  it("rejects future timestamp", async () => {
    const { payload, address } = await buildValidPayload(keypair, content, {
      challenge: { timestamp: Date.now() + 60 * 1000 }, // 1 min in future
    });
    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Challenge expired or future timestamp",
    });
  });

  it("rejects wrong content hash", async () => {
    const { payload, address } = await buildValidPayload(keypair, content);
    // Verify against different content than what was hashed in the challenge
    const result = await verifyTermsUpdateSignature(
      payload,
      address,
      "different content",
    );
    expect(result).toEqual({
      valid: false,
      reason: "Content hash mismatch",
    });
  });

  it("rejects wrong signer key", async () => {
    const { payload } = await buildValidPayload(keypair, content);
    // Use a different address as the expected one
    const otherKeypair = nacl.sign.keyPair();
    const otherAddress = encodeAddress(otherKeypair.publicKey);

    // Patch the challenge to have the other address (so address check passes)
    const challenge = JSON.parse(payload.challenge) as TermsUpdateChallenge;
    challenge.address = otherAddress;
    payload.challenge = JSON.stringify(challenge);

    const result = await verifyTermsUpdateSignature(
      payload,
      otherAddress,
      content,
    );
    expect(result).toEqual({
      valid: false,
      reason: "Signer does not match expected address",
    });
  });

  it("rejects tampered domain", async () => {
    const { payload, address } = await buildValidPayload(keypair, content, {
      domain: "legit.example.com",
    });
    // Tamper with the domain after signing
    payload.domain = "evil.example.com";

    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Domain integrity check failed",
    });
  });

  it("rejects invalid Ed25519 signature", async () => {
    const { payload, address } = await buildValidPayload(keypair, content);
    // Corrupt the signature by flipping a byte
    const sigBytes = Uint8Array.from(atob(payload.signature), (c) =>
      c.charCodeAt(0),
    );
    sigBytes[0] ^= 0xff;
    payload.signature = uint8ArrayToBase64(sigBytes);

    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Ed25519 signature verification failed",
    });
  });

  it("rejects invalid base64 in signature field", async () => {
    const { payload, address } = await buildValidPayload(keypair, content);
    payload.signature = "not-valid-base64!!!";

    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid challenge JSON", async () => {
    const { payload, address } = await buildValidPayload(keypair, content);
    payload.challenge = "not json {{{";

    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Invalid challenge JSON",
    });
  });
});
