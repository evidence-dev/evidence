import preprocess from '@evidence-dev/preprocess';
import { error } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

/**
 * @typedef {Object} PageManifestNode
 * @property {string | undefined} label
 * @property {string | undefined} href
 * @property {Record<string, PageManifestNode>} children
 * @property {Record<string, any>} frontMatter
 * @property {boolean} isTemplated
 * @property {boolean} isPage
 */

/**
 * @param {Record<string, string>} pages
 * @returns {PageManifestNode}
 */
export function _buildPageManifest(pages) {
	const fileTree = {
		label: 'Home',
		href: undefined,
		children: {},
		frontMatter: {},
		isTemplated: false,
		isPage: false
	};
	for (const [pagePath, pageContent] of Object.entries(pages)) {
		const path = pagePath.replace('src/pages/', '');
		let node = fileTree;
		for (const part of path.split('/')) {
			if (part === '+page.md') {
				// cover home page
				if (path === '+page.md') {
					node.href = '/';
				} else if (!path.includes('[')) {
					node.href = encodeURI('/' + path.replace('/+page.md', ''));
				}
				node.frontMatter = preprocess.parseFrontmatter(pageContent);
				node.isPage = true;
			} else {
				const label = part.includes('[') ? undefined : part.replace(/_/g, ' ').replace(/-/g, ' ');
				node = node.children[part] = node.children[part] ?? {
					label,
					href: undefined,
					children: {},
					frontMatter: {},
					isTemplated: part.includes('['),
					isPage: false
				};
			}
		}
	}
	return fileTree;
}

export const prerender = true;

/**
 * @type {import("@sveltejs/kit").RequestHandler}
 */
export async function GET() {
	const pages = {};

	/** @param {string} dir */
	async function recursiveReadDir(dir) {
		const dirents = await fs.readdir(dir, { withFileTypes: true });
		for (const dirent of dirents) {
			if (dirent.isFile() && dirent.name.endsWith('.md')) {
				const relative_path = path.join(dirent.parentPath ?? dirent.path ?? dir, dirent.name);
				const content = await fs.readFile(relative_path, 'utf-8');
				// regularize for windows
				const normalized_path = path.normalize(relative_path).replace('\\', '/');
				pages[normalized_path] = content;
			} else if (dirent.isDirectory()) {
				await recursiveReadDir(path.join(dir, dirent.name));
			}
		}
	}

	try {
		await recursiveReadDir(path.join('src', 'pages'));

		const fileTree = _buildPageManifest(pages);

		return new Response(JSON.stringify(fileTree));
	} catch (e) {
		console.log('Failed to build pages manifest with error: ', e);
		throw error(500, 'Failed to build pages manifest.');
	}
}
