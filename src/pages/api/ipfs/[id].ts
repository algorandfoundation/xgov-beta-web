import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
    const r = await fetch(`https://ipfs.algonode.xyz/ipfs/${params.cid}`)
    if (r.status === 404) {
        return new Response(null, {
            status: 404,
            statusText: "Not found",
        });
    }

    // Get the actual content type from the response
    const contentType = r.headers.get("content-type") || "image/png";

    return new Response(
        await r.arrayBuffer(),
        {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // Cache for 24 hours
            },
        }
    );
}
