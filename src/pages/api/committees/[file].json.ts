import type { APIRoute } from "astro";
import { getCommitteeFileResponse } from "@/server/committee-files";

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
  const file = params.file;
  if (!file) {
    return new Response("Committee file is required", { status: 400 });
  }

  return getCommitteeFileResponse(`${file}.json`, locals);
};
