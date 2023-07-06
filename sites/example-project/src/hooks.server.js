const cache_json_regex = /\/api\/[a-f0-9]{32}\.json/;

/** @satisfies {import("@sveltejs/kit").Handle} */
export const handle = async ({ resolve, event }) => {
	if (event.request.url.match(cache_json_regex)) return new Response(null, { status: 404 });
	return resolve(event);
};
