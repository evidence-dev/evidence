/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url }) => {
	return {
		pathname: url.pathname,
		serverRenderedAt: new Date().toISOString()
	};
};

