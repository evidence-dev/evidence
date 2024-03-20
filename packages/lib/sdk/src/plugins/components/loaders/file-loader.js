import fs from 'fs/promises';
import path from 'path';
import { parse as svelteParse } from 'svelte/compiler';

/**
 * Searches recursively within a directory for svelte files
 * Ignores anything beginning with . (hidden) or + (special sveltekit files)
 *
 * @param {string} root
 * @returns {Promise<string[]>}
 */
export const findSvelteComponents = async (root) => {
	/**
	 * @type {string[]}
	 */
	const output = [];
	// Scan & iterate directory
	const directoryContents = await fs.readdir(root, { withFileTypes: true });
	for (const item of directoryContents) {
		// Ignore these cases
		if (item.name === 'node_modules') continue; // Don't touch any dependencies
		if (item.name.startsWith('.')) continue; // Don't touch hidden files
		if (item.name.startsWith('+')) continue; // Don't touch sveltekit files

		// Build path; get item stats
		const itemPath = path.resolve(root, item.name);

		if (item.isDirectory()) {
			// Recurse on directories
			output.push(...(await findSvelteComponents(itemPath)));
		} else if (item.name.endsWith('.svelte')) {
			// Keep track of svelte components
			output.push(itemPath);
		}
	}

	// Return relative filepaths
	return output.map((p) => path.relative('.', p));
};

/**
 * Reduce function to run on a svelte AST.
 * Searches for the evidenceInclude declaration.
 * @example
 *  <script context="module">
 *      export const evidenceInclude = true
 *  </script>
 *
 * @param {import("estree").Node} currentNode
 * @returns {boolean}
 */
const nodeIsEvidenceDeclaration = (currentNode) => {
	// If this isn't the right kind of declaration, ignore it
	if (currentNode.type !== 'ExportNamedDeclaration') return false;

	const rootDeclaration = currentNode.declaration;

	if (rootDeclaration?.type !== 'VariableDeclaration') return false;

	// const only, this is somewhat inline with sveltekit's patterns
	if (rootDeclaration.kind !== 'const') return false;

	// This shouldn't be hit, but type safety
	if (!rootDeclaration?.declarations) return false;

	// Iterate through sub-declarations, I've only ever seen 1 here
	for (const declaration of rootDeclaration.declarations) {
		const { id, init } = declaration;
		// Check to see if this is a declaration for evidenceInclude
		if (id.type !== 'Identifier') continue;
		if (id.name !== 'evidenceInclude') continue;
		// Check to see if the value it is declared with is a true constant
		// We could shorten this; but this reads better
		if (init?.type !== 'Literal') continue;
		if (init.value !== true) continue;
		// We found what we want!
		return true;
	}
	// We never found the right declaration; continue the reduction
	return false;
};

/**
 * Generates an AST and searches it for the special declaration
 * @param {string} fileContent
 */
export const isLibraryComponent = async (fileContent) => {
	let result = false;

	// remove style tags, postcss can screw this up
	fileContent = fileContent.replace(/<style.*>(.|[\s])*<\/style>/g, '');
	// First parse the passed in file
	const parseResult = svelteParse(fileContent);
	// If there is a <script> tag, check there
	if (parseResult.instance) {
		result = result || Boolean(parseResult.instance.content.body.find(nodeIsEvidenceDeclaration));
	}
	// If there is a <script context="module"> tag, check there
	if (parseResult.module) {
		result = result || Boolean(parseResult.module.content.body.find(nodeIsEvidenceDeclaration));
	}
	return result;
};

/**
 * @param {string} rootDir
 *
 * @returns {Promise<string[]>}
 */
export async function fileLoader(rootDir) {
	const componentPaths = await findSvelteComponents(rootDir);
	const results = await Promise.all(
		componentPaths.map(async (componentPath) => ({
			include: await isLibraryComponent(
				await fs.readFile(componentPath).then((p) => p.toString())
			).catch((e) => {
				throw new Error(`Error while identifying ${componentPath}`, { cause: e });
			}),
			// Get the name of the component, takes the last part of the path and removes the file extension
			componentName: path.basename(componentPath, path.extname(componentPath))
		}))
	);

	return results.filter((r) => r.include).map((r) => r.componentName);
}
