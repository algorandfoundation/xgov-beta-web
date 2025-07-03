import { BASE_NFD_API_URL } from "@/api";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  const r = await fetch(`${BASE_NFD_API_URL}/${params.query}`)
  if(r.status === 404){
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }
  return new Response(
    await r.text(),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
