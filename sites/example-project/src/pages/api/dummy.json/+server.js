export const prerender = true;

export function GET() {
	return new Response(`{ "type": "data", "nodes": [] }\n`, {
		headers: { 'Content-Type': 'application/json' }
	});
}
