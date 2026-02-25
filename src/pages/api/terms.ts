import type { APIRoute } from "astro";
import { getGlobalState } from "@/api";
import {
  verifyTermsUpdateSignature,
  type Arc60SignaturePayload,
} from "@/lib/arc60";

const LATEST_KEY = "terms/latest";
const versionKey = (v: number) => `terms/v/${v}`;

function getR2(locals: App.Locals): R2Bucket | undefined {
  if ("runtime" in locals && locals.runtime) {
    return (locals.runtime as any)?.env?.BUCKET as R2Bucket | undefined;
  }
  return undefined;
}

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const bucket = getR2(locals);
    const requestedVersion = url.searchParams.get("version");

    if (bucket) {
      const key = requestedVersion
        ? versionKey(Number(requestedVersion))
        : LATEST_KEY;
      const obj = await bucket.get(key);
      if (obj) {
        const stored = await obj.text();
        const version = Number(obj.customMetadata?.version ?? 1);
        return new Response(
          JSON.stringify({ content: stored, source: "r2", version }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          },
        );
      }

      // Specific version requested but not found
      if (requestedVersion) {
        return new Response(
          JSON.stringify({ error: `Version ${requestedVersion} not found` }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Fallback to static file (version 0 — the bundled baseline)
    const staticTerms = await import(
      "@/components/ProfileCard/TermsAndConditionsText.md?raw"
    );
    return new Response(
      JSON.stringify({
        content: staticTerms.default,
        source: "static",
        version: 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching terms:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch terms",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { content, address } = body;

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'content' field" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!address || typeof address !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'address' field" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const arc60 = body.arc60 as Arc60SignaturePayload | undefined;
    if (
      !arc60 ||
      !arc60.challenge ||
      !arc60.signature ||
      !arc60.signer ||
      !arc60.domain ||
      !arc60.authenticatorData
    ) {
      return new Response(
        JSON.stringify({ error: "Missing ARC-60 signature payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Verify the caller is the xgovManager
    const globalState = await getGlobalState();
    if (!globalState?.xgovManager || address !== globalState.xgovManager) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: not xgovManager" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Verify ARC-60 signature proves caller controls the manager key
    const verification = await verifyTermsUpdateSignature(
      arc60,
      globalState.xgovManager,
      content,
    );
    if (!verification.valid) {
      return new Response(
        JSON.stringify({
          error: "Signature verification failed",
          reason: verification.reason,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const bucket = getR2(locals);
    if (!bucket) {
      return new Response(
        JSON.stringify({ error: "R2 storage not available" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    // Determine next version by reading current latest
    let nextVersion = 1;
    const current = await bucket.head(LATEST_KEY);
    if (current?.customMetadata?.version) {
      nextVersion = Number(current.customMetadata.version) + 1;
    }

    const metadata = {
      customMetadata: {
        version: String(nextVersion),
        updatedAt: new Date().toISOString(),
        updatedBy: address,
      },
    };

    // Write versioned copy and update latest
    await Promise.all([
      bucket.put(versionKey(nextVersion), content, metadata),
      bucket.put(LATEST_KEY, content, metadata),
    ]);

    return new Response(
      JSON.stringify({ success: true, version: nextVersion }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error updating terms:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update terms",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
