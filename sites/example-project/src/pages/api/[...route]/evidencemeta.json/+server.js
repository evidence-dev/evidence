import preprocessor from '@evidence-dev/preprocess';
import { json } from '@sveltejs/kit';

export const prerender = true;

const routes = import.meta.glob('../../../**/+page.md', { query: '?raw', import: 'default' });

export function entries() {
	return Object.keys(routes).map((route) => ({
		route: route.slice('../../../'.length, -'/+page.md'.length)
	}));
}

/** @type {import("./$types").RequestHandler} */
export async function GET({ params: { route } }) {
	const cleaned = `../../../${route}/+page.md`.split('/').filter(Boolean).join('/');
	const content = await routes[cleaned]();

	const partialInjectedContent = preprocessor.injectPartials(content);
	const queries = preprocessor.extractQueries(partialInjectedContent);

	return json({ queries });
}
