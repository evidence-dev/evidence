import { getQueries } from '@evidence-dev/db-orchestrator';
import md5 from 'blueimp-md5';
import { GET } from './api/customFormattingSettings.json/+server.js';
import { getStatusAndExtractQueries } from './extractQueries.server.js';
export const prerender = true;
export const trailingSlash = 'always';

const system_routes = ['/settings', '/explore'];

/** @satisfies {import("./$types").LayoutServerLoad} */
export async function load({ route, params }) {
	const isUserPage =
		route.id && system_routes.every((system_route) => !route.id.startsWith(system_route));

	const routeHash = md5(route.id);
	const paramsHash = md5(
		Object.entries(params)
			.sort()
			.map(([key, value]) => `${key}\x1F${value}`)
			.join('\x1E')
	);

	if (isUserPage) {
		// todo: remove this
		await getStatusAndExtractQueries(route.id);
	}

	const customFormattingSettingsRes = await GET();
	const { customFormattingSettings } = await customFormattingSettingsRes.json();

	return {
		routeHash,
		paramsHash,
		customFormattingSettings,
		isUserPage,
		evidencemeta: getQueries(routeHash)
	};
}
