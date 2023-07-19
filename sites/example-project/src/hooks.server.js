import { get_cache_for_hash } from '@evidence-dev/universal-sql';

/** @type {import("@sveltejs/kit").Handle} */
export const handle = ({ event, resolve }) => {
	// bypass the actual endpoint so it isn't processed by sveltekit, specifically the `render_endpoint` function
	if (event.route.id === '/api/[route_hash]/[query_name].arrow') {
		const resp = new Response(
			// initialize with empty Uint8Array so the constructor sets content type and such to the correct values
			new Uint8Array(0),
			// add sveltekit special header to ensure the response is cached
			// replicates behavior of https://github.com/sveltejs/kit/blob/b251b235b321b9c75236429cc3a1ac2415475775/packages/kit/src/runtime/server/endpoint.js#L61
			{ headers: { 'x-sveltekit-prerender': 'true' } }
		);

		// Proxy the response to intercept the arrayBuffer method, specifically the one in `prerender`
		// https://github.com/sveltejs/kit/blob/b251b235b321b9c75236429cc3a1ac2415475775/packages/kit/src/core/postbuild/prerender.js#L258
		return new Proxy(resp, {
			get(response, key) {
				const get_cache = () => {
					// lazy load the cache to ensure the page can saturate it first
					// heavily dependent on https://github.com/sveltejs/kit/blob/b251b235b321b9c75236429cc3a1ac2415475775/packages/kit/src/core/postbuild/prerender.js#L258
					try {
						return get_cache_for_hash(event.params.route_hash, event.params.query_name);
					} catch (e) {
						// if the query hasn't been prerendered, just return an empty buffer
						return Buffer.alloc(0);
					}
				};

				if (key === 'arrayBuffer') {
					return get_cache;
				} else if (key === 'body') {
					// handle dev mode requests
					return new ReadableStream({
						start(controller) {
							controller.enqueue(get_cache());
							controller.close();
						}
					})
				}

				return Reflect.get(response, key, response);
			}
		});
	}
	return resolve(event);
};
