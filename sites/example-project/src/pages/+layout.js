import { dev } from '$app/environment';
export const load = async ({ fetch, route, data: parentData }) => {
	if (route.id && route.id !== '/settings') {
		const { customFormattingSettings, routeHash } = parentData;

		const res = await fetch(`/api/${routeHash}.json`);

		/*
			Explanation of the below:
			The SvelteKit `fetch` uses a proxy[0] to prevent a request happening on
			both server and client execution of load functions
			- This is good during dev, as it prevents the multiple queries from firing
			- But bad during build, as it inlines the response into the SSR'd page,
			  which blows up build folder/html size
			So, we conditionally clone the response to bypass the proxy during build,
			but not during dev

			[0] - https://github.com/sveltejs/kit/blob/master/packages/kit/src/runtime/server/page/load_data.js#L297
		*/
		const { data } = dev? await res.json() : await res.clone().json();

		return {
			data,
			customFormattingSettings
		};
	}
};
