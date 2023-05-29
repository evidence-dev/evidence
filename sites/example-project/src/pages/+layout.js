import { browser } from '$app/environment';

async function getDataOnServer(route) {
	return (await import('./api/[route].json/+server.js')).GET({ params: { route } });
}

export const load = async ({ fetch, route, data: { customFormattingSettings, routeHash } }) => {
	if (route.id && route.id !== '/settings') {
        if (!browser) await fetch(`/api/${routeHash}.json`);

		// not using the load fetch so the data is not inlined in the html
		const res = await (browser
			? window.fetch(`/api/${routeHash}.json`)
			: getDataOnServer(routeHash));

		const { data } = await res.json();
		return {
			data,
			customFormattingSettings
		};
	}
};
