import preprocess from '@evidence-dev/preprocess';
import { error } from '@sveltejs/kit';

// Import pages and create an object structure corresponding to the file structure
const pages = import.meta.glob('/src/pages/*/**/+page.md', {
	import: 'default',
	query: 'raw',
	eager: true
});

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
		for (const [pagePath, pageContent] of Object.entries(pages)) {
			const path = pagePath.replace('/src/pages/', '');
			let node = fileTree;
			for (const part of path.split('/')) {
				if (part === '+page.md') {
					const href = path.includes('[')
						? undefined
						: encodeURI('/' + path.replace('/+page.md', ''));
					const frontMatter = preprocess.parseFrontmatter(pageContent);
					node.href = href;
					node.frontMatter = frontMatter;
				} else {
					const label = part.includes('[') ? undefined : part.replace(/_/g, ' ').replace(/-/g, ' ');
					node.isTemplated = part.includes('[');
					node = node.children[part] = node.children[part] ?? {
						label,
						children: {},
						href: undefined,
						isTemplated: false
					};
				}
			}
		}
		deleteEmptyNodes(fileTree);
		convertChildrenToArray(fileTree);
		return new Response(JSON.stringify(fileTree));
	} catch {
		throw error(500, 'Failed to build pages manifest.');
	}
}
