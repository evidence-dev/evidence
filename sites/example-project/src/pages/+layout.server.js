import { getQueries } from "@evidence-dev/db-orchestrator";
import md5 from 'blueimp-md5';
import { GET } from './api/customFormattingSettings.json/+server.js';
export const prerender = true;
export const trailingSlash = 'always';

/** @type {import("./$types").LayoutServerLoad} */
export async function load({ fetch, route }) {
	if (route.id && route.id !== '/settings') {
		const routeHash = md5(route.id);
		// ensure that queries have been extracted before initiating the load process
		let statusEndpoint = `/api/status${route.id}`.replace(/\/$/, '');
		await fetch(statusEndpoint);

		const customFormattingSettingsRes = await GET();
		const { customFormattingSettings } = await customFormattingSettingsRes.json();

		/** @type {{ renderedFiles: string[] }} */
		const { renderedFiles = [] } = await fetch('/data/manifest.json')
			.then((res) => res.json())
			.catch(() => ({}));

		return {
			routeHash,
			customFormattingSettings,
			renderedFiles,
            evidencemeta: getQueries(routeHash)
		};
	}
}
