import { getQueries } from '@evidence-dev/db-orchestrator';
import md5 from 'blueimp-md5';
import { GET } from './api/customFormattingSettings.json/+server.js';
export const prerender = true;
export const trailingSlash = 'always';

const system_routes = ['/settings', '/explore'];

/** @satisfies {import("./$types").LayoutServerLoad} */
export async function load({ fetch, route, params }) {
	const isUserPage =
		route.id && system_routes.every((system_route) => !route.id.startsWith(system_route));

	const routeHash = md5(route.id);
	const paramsHash = md5(
		Object.entries(params)
			.sort()
			.map(([key, value]) => `${key}:${value}`)
			.join('\x1F')
	);

	if (isUserPage) {
		// ensure that queries have been extracted before initiating the load process
		const statusEndpoint = `/api/status${route.id}`.replace(/\/$/, '');
		await fetch(statusEndpoint);
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
