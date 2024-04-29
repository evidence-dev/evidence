export const prerender = true;

/**
 * An "empty" placeholder to prevent `__data.json` requests returning 404 in SPA mode
 * See: https://github.com/sveltejs/kit/blob/508d7c0679cab3d8538d6c37d3cd670fdba62ed1/packages/kit/src/runtime/client/client.js#L2470
 */
export function GET() {
	return new Response(`{ "type": "data", "nodes": [] }\n`, {
		headers: { 'Content-Type': 'application/json' }
	});
}
