import fs from 'fs-extra';
import path from 'path';
import preprocess from '@evidence-dev/preprocess';
import { error } from '@sveltejs/kit';

// Import pages and create an object structure corresponding to the file structure
const pages = import.meta.glob(['/src/pages/**/+page.md']);
const pagePaths = Object.keys(pages).map((path) => path.replace('/src/pages/', ''));

export const prerender = true;

// Convert children objects into arrays of objects
function convertChildrenToArray(node) {
	if (node.children) {
		node.children = Object.keys(node.children).map(function (key) {
			return node.children[key];
		});
		node.children.forEach(function (child) {
			convertChildrenToArray(child);
		});
	}
}

// Recursively delete nodes and children nodes that don't have a label
function deleteEmptyNodes(node) {
	if (node.children) {
		Object.keys(node.children).forEach(function (key) {
			deleteEmptyNodes(node.children[key]);
			if (!node.children[key].label && !node.children[key].href) {
				delete node.children[key];
			}
		});
	}
}

/**
 * @type {import("@sveltejs/kit").RequestHandler}
 */
export async function GET() {
	try {
		const fileTree = {
			label: 'Home',
			href: '/',
			children: {},
			isTemplated: false
		};
		pagePaths.forEach(function (pagePath) {
			pagePath.split('/').reduce(function (r, e) {
				if (e === '+page.md') {
					const href = pagePath.includes('[')
						? undefined
						: encodeURI('/' + pagePath.replace(/\/?\+page.md$/, ''));

					const absolutePath = path.join(process.cwd(), 'src', 'pages', pagePath);
					const pageContent = fs.readFileSync(absolutePath, 'utf-8');
					const frontMatter = preprocess.parseFrontmatter(pageContent);

					return (r['href'] = href), (r['frontMatter'] = frontMatter);
				} else {
					const label = e.includes('[') ? undefined : e.replace(/_/g, ' ').replace(/-/g, ' ');
					r.isTemplated = e.includes('[');
					return (
						r?.children[e] ||
						(r.children[e] = {
							label,
							children: {},
							href: undefined,
							isTemplated: false
						})
					);
				}
			}, fileTree);
		});
		deleteEmptyNodes(fileTree);
		convertChildrenToArray(fileTree);
		return new Response(JSON.stringify(fileTree));
	} catch {
		throw error(500, 'Failed to build pages manifest.');
	}
}
