export const load = async ({ fetch, route, data: { customFormattingSettings, routeHash } }) => {
	if (route.id && route.id !== '/settings') {
		const res = await fetch(`/api/${routeHash}.json`);
        // sveltekit inlines json but not arraybuffers, do not change
		const buffer = await res.arrayBuffer();
        const { data } = JSON.parse(new TextDecoder().decode(buffer));

		return {
			data,
			customFormattingSettings
		};
	}
};
