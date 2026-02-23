import fs from 'fs/promises';
import path from 'path';
import preprocessor from '@evidence-dev/preprocess';
import { json } from '@sveltejs/kit';
import { paths, isExampleProject } from '@evidence-dev/sdk/meta';

export const prerender = true;

/** @type {import('./$types').EntryGenerator} */
export const entries = async () => {
	const pagesDir = paths.pagesDirectory;

	const allPages = (await fs.readdir(pagesDir, { recursive: true })).filter((f) =>
		f.endsWith('.md')
	); // Discard everything that isn't a page

	const output = allPages.map((filepath) => {
		// Example Project is special
		const removal = isExampleProject ? '/+page.md' : '.md';
		let result = filepath.slice(0, -removal.length);
		if (filepath.endsWith('index.md')) result = result.replaceAll(/\/?index/g, '');
		return { route: result };
	});

	return output;
};

/** @type {import("./$types").RequestHandler} */
export async function GET({ params: { route } }) {
	const normalizedRoute = route.replace(/^\/+/, '');

	if (normalizedRoute === 'settings') {
		const queries = [];
		return json({ queries });
	}
	let routesDir;
	if ((await fs.readdir(process.cwd())).includes('src')) {
		routesDir = path.join('src', 'pages'); // example project wackiness
	} else {
		routesDir = path.join('.evidence', 'template', 'src', 'pages');
	}
	const routePath = path.join(process.cwd(), routesDir, normalizedRoute, '+page.md');

	let content;
	try {
		content = await fs.readFile(routePath, 'utf8');
	} catch (e) {
		// Non-markdown routes (for example +page.svelte) do not have query metadata files.
		if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
			return json({ queries: [] });
		}
		throw e;
	}

	const partialInjectedContent = preprocessor.injectPartials(content);
	const queries = preprocessor.extractQueries(partialInjectedContent);

	return json({ queries });
}
