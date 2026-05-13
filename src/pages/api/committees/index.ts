import type { APIRoute } from "astro";
import { listCommitteeFiles } from "@/server/committee-files";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const files = await listCommitteeFiles(locals);

    return new Response(JSON.stringify({ files }), {
      headers: {
        "cache-control": "public, max-age=60",
        "content-type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unable to list committee files",
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 500,
      },
    );
  }
};
