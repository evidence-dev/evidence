import { dev } from '$app/environment';
export const load = async ({ fetch, route, data: parentData }) => {
	if (route.id && route.id !== '/settings') {
		const { customFormattingSettings, routeHash } = parentData;

		let data, json;
		const res = await fetch(`/api/${routeHash}.json`);
		
		// don't clone the response if we're in dev mode as it causes multiple queries to fire
		// but when building we do to bypass the proxy https://github.com/sveltejs/kit/blob/master/packages/kit/src/runtime/server/page/load_data.js#L297
		if (dev) {
			json = await res.json();
		} else {
			json = await res.clone().json();
		}
		data = json.data;

		return {
			data,
			customFormattingSettings
		};
	}
};
