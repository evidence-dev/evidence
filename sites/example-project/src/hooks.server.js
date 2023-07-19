import { get_cache_for_hash } from '@evidence-dev/universal-sql';

/** @type {import("@sveltejs/kit").Handle} */
export const handle = ({ event, resolve }) => {
	if (event.route.id === '/api/[route_hash]/[query_name].arrow') {
		// bypass the actual endpoint so it isn't processed by sveltekit
		// https://github.com/sveltejs/kit/blob/b251b235b321b9c75236429cc3a1ac2415475775/packages/kit/src/runtime/server/endpoint.js#L56
		const resp = new Response(new Uint8Array(0), { headers: { 'x-sveltekit-prerender': 'true' } });
		return new Proxy(resp, {
			get(response, key) {
				if (key === 'arrayBuffer') {
					return () => {
						// lazy load the cache to ensure the page can saturate it first
						// heavily dependent on https://github.com/sveltejs/kit/blob/b251b235b321b9c75236429cc3a1ac2415475775/packages/kit/src/core/postbuild/prerender.js#L258
						return get_cache_for_hash(event.params.route_hash, event.params.query_name);
					};
				}

				return Reflect.get(response, key, response);
			}
		});
	}
	return resolve(event);
};
