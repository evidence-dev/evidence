export const load = async ({ fetch, route, data: parentData }) => {
	if (route.id && route.id !== '/settings') {
		const { customFormattingSettings, routeHash } = parentData;
		const res = await fetch(`/api/${routeHash}.json`);
		// has to be cloned to bypass the proxy https://github.com/sveltejs/kit/blob/master/packages/kit/src/runtime/server/page/load_data.js#L297
		const { data } = await res.clone().json();

		return {
			data,
			customFormattingSettings
		};
	}
};
