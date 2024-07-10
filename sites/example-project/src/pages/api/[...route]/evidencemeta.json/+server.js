import fs from 'fs/promises';
import path from 'path';
import preprocessor from '@evidence-dev/preprocess';
import { json } from '@sveltejs/kit';

export const prerender = true;

/** @type {import("./$types").RequestHandler} */
export async function GET({ params: { route } }) {
	let routesDir;
	if ((await fs.readdir(process.cwd())).includes('src')) {
		routesDir = path.join('src', 'pages'); // example project wackiness
	} else {
		routesDir = path.join('.evidence', 'template', 'src', 'pages');
	}
	const routePath = path.join(process.cwd(), routesDir, route, '+page.md');

	const content = await fs.readFile(routePath, 'utf8');

	const partialInjectedContent = preprocessor.injectPartials(content);
	const queries = preprocessor.extractQueries(partialInjectedContent);

	return json({ queries });
}
