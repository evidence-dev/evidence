import md5 from 'blueimp-md5';
import { GET } from './api/customFormattingSettings.json/+server.js';
import { base } from '$app/paths';
export const prerender = true;
export const trailingSlash = 'always';

/** @type {import("@sveltejs/kit").Load} */
export async function load({ fetch, route }) {
	console.log('layout.server.js', { route: route.id, hash: md5(route.id) });
	if (route.id && route.id !== `${base}/settings`) {
		const routeHash = md5(route.id);
		// ensure that queries have been extracted before initiating the load process
		let statusEndpoint = `${base}/api/status${route.id}`.replace(/\/$/, '');
		await fetch(statusEndpoint);

		const res = await fetch(`${base}/api/${routeHash}.json`);

		const { data } = await res.json();

		const customFormattingSettingsRes = await GET();
		const { customFormattingSettings } = await customFormattingSettingsRes.json();
		return {
			data,
			customFormattingSettings
		};
	}
}
