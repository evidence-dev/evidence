import fs from 'fs/promises';
import path from 'path';
import preprocess from '@evidence-dev/preprocess';
import { preprocess as sveltePreprocess } from 'svelte/compiler';
import { error } from '@sveltejs/kit';

export const prerender = true;

/**
 * @type {import("@sveltejs/kit").RequestHandler}
 */
export async function GET() {
	// Check that there is somewhere to look for paths
	// We need to check for src/pages because of example-project
	const srcPath = path.join(process.cwd(), 'src', 'pages');
	const pagesPath = path.join(process.cwd(), 'pages');

	const srcExists = await fs
		.stat(srcPath)
		.then(() => true)
		.catch(() => false);
	const pagesExists = await fs
		.stat(pagesPath)
		.then(() => true)
		.catch(() => false);

	// If we can't find a pages directory, we should abort
	if (!srcExists && !pagesExists) throw error(500, './src/pages and ./pages both missing.');

	// trunc to the pages directory
	const pagesDir = (srcExists ? srcPath : pagesPath).split('pages')[0] + 'pages';

	/**
	 * @param {string} dirPath
	 */
	async function getDirPages(dirPath) {
		// Get directory contents
		const dirContent = await fs.readdir(dirPath, { withFileTypes: true });
		const output = {};
		if (!dirPath.includes('queries') && !dirContent.some((d) => d.name === 'queries'))
			return output;

		if (dirContent.some((d) => d.name === '+page.md')) {
			// Get the web url of the route
			// This doesn't do anything with parameter substitution; the consumer is responsible for that
			let route = dirPath.replace(pagesDir, '');
			// Get the filepath for the page markdown file
			const pageFilepath = path.join(dirPath, '+page.md');

			// Ensure we have a leading /, else it could be interpreted as relative
			if (!route.startsWith('/')) route = `/${route}`;

			// Read the contents of the file
			const fileContent = await fs.readFile(pageFilepath, 'utf-8');

			// Exec the preprocessing step to ensure that we don't drop stuff from partials
			const preprocessedContent = await sveltePreprocess(fileContent, preprocess(), {
				filename: pageFilepath
			}).then((r) => `\n${r.code}`);

			// Construct metadata
			output.__page = {
				path: route,
				// Object matching the frontmatter on the page; may or may not exist
				frontMatter: preprocess.parseFrontmatter(fileContent),
				// Retrive all queries from the page, this will always be an array
				queries: preprocess.extractQueries(preprocessedContent, pageFilepath),
				content: fileContent
			};
		}

		// Recurse to check for child directories
		for (const dirItem of dirContent) {
			if (dirItem.isDirectory()) {
				const result = await getDirPages(path.join(dirPath, dirItem.name));
				if (Object.keys(result).length) output[dirItem.name] = result;
			}
		}
		return output;
	}

	const manifest = await getDirPages(pagesDir);

	return new Response(JSON.stringify(manifest)
}
