import preprocess from '@evidence-dev/preprocess';
import fs from 'fs';

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
 * @param {PageManifestNode} fileTree
 * @param {string} pagePath
 * @param {string} pageContent
 */
function addPageToTree(fileTree, pagePath, pageContent) {
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

/** @type {PageManifestNode} */
const fileTree = {
	label: 'Home',
	href: undefined,
	children: {},
	frontMatter: {},
	isTemplated: false,
	isPage: false
};

try {
	const pagesDir = fs.readdirSync('src/pages', { withFileTypes: true });
	for (const dirent of pagesDir) {
		if (dirent.isDirectory()) {
			const pageDir = fs.readdirSync(`src/pages/${dirent.name}`, { withFileTypes: true });
			for (const pageDirent of pageDir) {
				if (pageDirent.isFile() && pageDirent.name.endsWith('.md')) {
					const path = `src/pages/${dirent.name}/${pageDirent.name}`;
					const content = fs.readFileSync(path, 'utf-8');
					addPageToTree(fileTree, '/' + path, content);
				}
			}
		}
	}
} catch (e) {
	console.log('Failed to build file tree: ', e.message);
}

export const prerender = true;

/**
 * @type {import("@sveltejs/kit").RequestHandler}
 */
export async function GET() {
	return new Response(JSON.stringify(fileTree));
}
