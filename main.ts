const head: Record<string, string> = {
    "content-type": "application/javascript",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "accept, authorization, content-type, user-agent, x-csrftoken, x-requested-with",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/load") {
        const res = await fetch("file:///src/load.js");
        for (const key in head) {
            if (Object.prototype.hasOwnProperty.call(head, key)) {
                res.headers.set(key, head[key]);
            }
        }
        return res;
    }
    return new Response("");
});
