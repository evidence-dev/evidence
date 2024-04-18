import md5 from 'blueimp-md5';
import { GET as getSettings } from './api/customFormattingSettings.json/+server.js';
import { GET as getPagesManifest } from './api/pagesManifest.json/+server.js';

export const ssr = false;
export const prerender = false;
export const trailingSlash = 'always';

/** @satisfies {import("./$types").LayoutServerLoad} */
export async function load({ route, params, fetch }) {
	const routeHash = md5(route.id);
	const paramsHash = md5(
		Object.entries(params)
			.sort()
			.map(([key, value]) => `${key}\x1F${value}`)
			.join('\x1E')
	);

	const evidencemetaRes = await fetch(`/api/${route.id}/evidencemeta.json`);
	const evidencemeta = evidencemetaRes.ok ? await evidencemetaRes.json() : { queries: [] };

	const customFormattingSettingsRes = await getSettings();
	const { customFormattingSettings } = await customFormattingSettingsRes.json();

	const pagesManifestRes = await getPagesManifest();
	const pagesManifest = await pagesManifestRes.json();

	return {
		routeHash,
		paramsHash,
		customFormattingSettings,
		evidencemeta,
		pagesManifest
	};
}
