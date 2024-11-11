import { base } from '$app/paths';

export const prerender = true;

const webmanifest = {
	icons: [
		{
			src: `${base}/icon-192.png`,
			type: 'image/png',
			sizes: '192x192'
		},
		{
			src: `${base}/icon-512.png`,
			type: 'image/png',
			sizes: '512x512'
		}
	]
};

/** @type {import('./$types').RequestHandler} */
export const GET = () => new Response(JSON.stringify(webmanifest));
