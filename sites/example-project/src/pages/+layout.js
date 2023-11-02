export const load = async ({ fetch, route, data: parentData }) => {
	if (route.id && route.id !== '/settings') {
		const { customFormattingSettings, routeHash } = parentData;
		const { data } = await fetch(`/api/${routeHash}.json`).then(res=> res.json());

		return {
			data,
			customFormattingSettings
		};
	}
};
