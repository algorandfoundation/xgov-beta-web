import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import { encodeAddress } from "algosdk";
import {
  sha256Hex,
  buildTermsUpdateChallenge,
  verifyTermsUpdateSignature,
  type Arc60SignaturePayload,
  type SiwaChallenge,
} from "./arc60";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function sha256(
  data: Uint8Array,
): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>);
  return new Uint8Array(hash);
}

/**
 * Build a fully valid ARC-60 SIWA payload for testing.
 *
 * The signed message follows the Lute / use-wallet convention:
 *   SHA256(challengeJson) || SHA256(authenticatorData)
 */
async function buildValidPayload(
  keypair: nacl.SignKeyPair,
  content: string,
  overrides?: {
    challenge?: Partial<SiwaChallenge>;
    domain?: string;
  },
): Promise<{ payload: Arc60SignaturePayload; address: string }> {
  const address = encodeAddress(keypair.publicKey);
  const contentHash = await sha256Hex(content);
  const domain = overrides?.domain ?? "xgov.algorand.foundation";

  const challenge: SiwaChallenge = {
    domain,
    chain_id: "283",
    account_address: address,
    type: "ed25519",
    statement: "Update xGov terms and conditions",
    uri: `https://${domain}`,
    version: "1",
    nonce: contentHash,
    "issued-at": new Date().toISOString(),
    resources: ["update-terms"],
    ...overrides?.challenge,
  };
  const challengeJson = JSON.stringify(
    challenge,
    Object.keys(challenge).sort(),
  );
  const challengeB64 = btoa(challengeJson);

  // authenticatorData = SHA256(domain) (minimal: just the 32-byte domain hash)
  const domainHash = await sha256(new TextEncoder().encode(domain));
  const authenticatorData = domainHash;

  // Signed message per Lute convention: SHA256(challengeJson) || SHA256(authenticatorData)
  const clientDataHash = await sha256(new TextEncoder().encode(challengeJson));
  const authDataHash = await sha256(authenticatorData);
  const message = new Uint8Array(64);
  message.set(clientDataHash, 0);
  message.set(authDataHash, 32);

  const signature = nacl.sign.detached(message, keypair.secretKey);

  return {
    address,
    payload: {
      challenge: challengeB64,
      signature: uint8ArrayToBase64(signature),
      signer: uint8ArrayToBase64(keypair.publicKey),
      domain,
      authenticatorData: uint8ArrayToBase64(authenticatorData),
    },
  };
}

describe("sha256Hex", () => {
  it("produces correct hash for known test vector", async () => {
    const result = await sha256Hex("hello");
    expect(result).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});

describe("buildTermsUpdateChallenge", () => {
  it("returns canonical SIWA JSON with sorted keys", () => {
    const json = buildTermsUpdateChallenge(
      "TESTADDR",
      "abc123",
      "https://xgov.algorand.foundation",
    );
    const parsed = JSON.parse(json) as SiwaChallenge;
    expect(parsed.account_address).toBe("TESTADDR");
    expect(parsed.nonce).toBe("abc123");
    expect(parsed.resources).toEqual(["update-terms"]);
    expect(parsed.domain).toBe("xgov.algorand.foundation");
    expect(parsed.chain_id).toBe("283");
    expect(parsed.type).toBe("ed25519");

    // Verify keys are sorted
    const keys = Object.keys(parsed);
    expect(keys).toEqual([...keys].sort());
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

  it("rejects missing update-terms resource", async () => {
    const { payload, address } = await buildValidPayload(keypair, content, {
      challenge: { resources: ["other-action"] },
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
      challenge: { account_address: otherAddress },
    });
    const address = encodeAddress(keypair.publicKey);
    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Challenge address mismatch",
    });
  });

  it("rejects expired timestamp", async () => {
    const { payload, address } = await buildValidPayload(keypair, content, {
      challenge: {
        "issued-at": new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      },
    });
    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Challenge expired or future timestamp",
    });
  });

  it("rejects future timestamp", async () => {
    const { payload, address } = await buildValidPayload(keypair, content, {
      challenge: {
        "issued-at": new Date(Date.now() + 60 * 1000).toISOString(),
      },
    });
    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Challenge expired or future timestamp",
    });
  });

  it("rejects wrong content hash", async () => {
    const { payload, address } = await buildValidPayload(keypair, content);
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
    const otherKeypair = nacl.sign.keyPair();
    const otherAddress = encodeAddress(otherKeypair.publicKey);

    // Patch the challenge to have the other address (so address check passes)
    const challengeJson = atob(payload.challenge);
    const challenge = JSON.parse(challengeJson) as SiwaChallenge;
    challenge.account_address = otherAddress;
    payload.challenge = btoa(
      JSON.stringify(challenge, Object.keys(challenge).sort()),
    );

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
    payload.domain = "evil.example.com";

    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Domain integrity check failed",
    });
  });

  it("rejects invalid Ed25519 signature", async () => {
    const { payload, address } = await buildValidPayload(keypair, content);
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
    payload.challenge = btoa("not json {{{");

    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Invalid challenge JSON",
    });
  });

  it("rejects invalid base64 in challenge field", async () => {
    const { payload, address } = await buildValidPayload(keypair, content);
    payload.challenge = "!!!not-valid-base64!!!";

    const result = await verifyTermsUpdateSignature(payload, address, content);
    expect(result).toEqual({
      valid: false,
      reason: "Invalid challenge JSON",
    });
  });
});
