import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  const r = await fetch(`https://forum.algorand.co/t/${params.id}.json`)
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
