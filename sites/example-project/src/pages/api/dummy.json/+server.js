export const prerender = true;

export const GET = () => new Response(`{ "type": "data", "nodes": [] }\n`, { headers: { 'Content-Type': 'application/json' } });
