export const load = async ({ fetch, route, data: { customFormattingSettings, routeHash } }) => {
	if (route.id && route.id !== '/settings') {
		const res = await fetch(`/api/${routeHash}.json`);
        // has to be cloned to bypass the proxy https://github.com/sveltejs/kit/blob/master/packages/kit/src/runtime/server/page/load_data.js#L297
		const { data } = await res.clone().json();

		return {
			data,
			customFormattingSettings
		};
	}
};
