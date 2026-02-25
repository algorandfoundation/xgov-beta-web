import type { APIRoute } from "astro";
import { getGlobalState } from "@/api";

const TERMS_KV_KEY = "terms_content";

async function getKV(locals: App.Locals): Promise<KVNamespace | undefined> {
  if ("runtime" in locals && locals.runtime) {
    return (locals.runtime as any)?.env?.KV as KVNamespace | undefined;
  }
  return undefined;
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const kv = await getKV(locals);

    if (kv) {
      const stored = await kv.get(TERMS_KV_KEY);
      if (stored) {
        return new Response(
          JSON.stringify({ content: stored, source: "kv" }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          },
        );
      }
    }

    // Fallback to static file
    const staticTerms = await import(
      "@/components/ProfileCard/TermsAndConditionsText.md?raw"
    );
    return new Response(
      JSON.stringify({ content: staticTerms.default, source: "static" }),
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

    // Verify the caller is the xgovManager
    const globalState = await getGlobalState();
    if (!globalState?.xgovManager || address !== globalState.xgovManager) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: not xgovManager" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const kv = await getKV(locals);
    if (!kv) {
      return new Response(
        JSON.stringify({ error: "KV storage not available" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    await kv.put(TERMS_KV_KEY, content, {
      metadata: {
        updatedAt: new Date().toISOString(),
        updatedBy: address,
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
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
