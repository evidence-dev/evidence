import preprocess from '@evidence-dev/preprocess';
import { error } from '@sveltejs/kit';

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
		const path = pagePath.replace('/src/pages/', '');
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

// Import pages and create an object structure corresponding to the file structure
const pages = import.meta.glob('/src/pages/**/+page.md', {
	import: 'default',
	query: 'raw',
	eager: true
});

export const prerender = true;

/**
 * @type {import("@sveltejs/kit").RequestHandler}
 */
export async function GET() {
	try {
		const fileTree = _buildPageManifest(pages);

		return new Response(JSON.stringify(fileTree));
	} catch {
		throw error(500, 'Failed to build pages manifest.');
	}
}
