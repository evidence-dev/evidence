// TODO: Kit

import { findFile } from 'pkg-types';
import { parse, prettyPrint, visit } from 'recast';
import fs from 'fs/promises';
import { EvidenceError } from '../../../lib/EvidenceError.js';

/**
 *
 * @param {import("estree").Property} node
 * @param {string} importName
 */
const insertPreprocessor = (node, importName) => {
	/** @type {import("estree").ArrayExpression} */
	let arrayValue;

	if (node.value.type !== 'ArrayExpression') {
		arrayValue = {
			type: 'ArrayExpression',
			elements: []
		};

		if (node.value.type === 'CallExpression') {
			arrayValue.elements.push(/** @type {import("estree").Expression} */ (node.value));
		}

		if (node.value.type === 'Identifier') arrayValue.elements.push(node.value);
	} else {
		arrayValue = /** @type {import("estree").ArrayExpression} */ (node.value);
	}

	if (
		!arrayValue.elements.some(
			(el) =>
				el && // not null
				el.type === 'CallExpression' && // is function call
				el.callee.type == 'Identifier' && // has name
				el.callee.name === importName // name is correct import
		)
	) {
		// Add the call
		arrayValue.elements.push({
			type: 'CallExpression',
			callee: {
				type: 'Identifier',
				name: importName
			},
			arguments: [],
			optional: false
		});
	}

	node.value = arrayValue;
};

export const updateSvelteConfig = async () => {
	const svelteConfig = await findFile('svelte.config.ts')
		.catch(() => findFile('svelte.config.js'))
		.catch(() => {
			throw new Error(
				'Could not find a valid svelte configuration file (svelte.config.js, svelte.config.ts)'
			);
		});
	const svelteConfigContent = await fs.readFile(svelteConfig, 'utf-8');
	/** @type {{program: import("estree").Program}} */
	const { program: svelteConfigAst } = await parse(svelteConfigContent);

	let foundImport = false;
	let importName = 'evidenceSvelte';

	let foundPreprocess = false;

	visit(svelteConfigAst, {
		visitImportDeclaration({ node }) {
			if (node.source.value !== '@evidence-dev/sdk')
				// TODO: Update this package title
				return false;

			const importValue = node.specifiers?.find(
				(spec) => spec.type === 'ImportSpecifier' && spec.imported.name === 'evidenceSvelte'
			);
			if (importValue && importValue.type === 'ImportSpecifier') {
				foundImport = true;

				if (importValue.local) {
					let v = importValue.local.name;
					while (typeof v !== 'string') v = v.name;
					importName = v;
				} else {
					let v = importValue.imported.name;
					while (typeof v !== 'string') v = v.name;
					importName = v;
				}

				return false;
			} else if (importValue) {
				throw new EvidenceError('Failed to add needed imports to svelte configuration');
			}
			return false;
		},
		visitProperty({ node }) {
			if (
				node.type === 'Property' &&
				node.key.type === 'Identifier' &&
				node.key.name === 'preprocess'
			) {
				foundPreprocess = true;
				insertPreprocessor(/** @type {import("estree").Property} */ (node), importName);
			}
			return false;
		}
	});

	if (!foundImport) {
		svelteConfigAst.body = [
			{
				type: 'ImportDeclaration',
				specifiers: [
					{
						type: 'ImportSpecifier',
						imported: { type: 'Identifier', name: importName },
						local: { type: 'Identifier', name: importName }
					}
				],
				source: {
					type: 'Literal',
					value: '@evidence-dev/sdk'
				}
			},
			...svelteConfigAst.body
		];
	}
	if (!foundPreprocess) {
		let updatedPreprocess = false;
		visit(svelteConfigAst, {
			visitVariableDeclaration({ node }) {
				const config =
					/** @type {import("estree").VariableDeclarator | undefined} */
					(
						node.declarations.find(
							(dec) =>
								dec.type === 'VariableDeclarator' && // declaring a variable
								dec.id.type === 'Identifier' && // id is an id I guess
								dec.id.name === 'config' // variable is named config
						)
					);
				if (!config) return false;
				if (!config.init) return false;
				if (config.init.type !== 'ObjectExpression') return false; // TODO: How to handle this case?

				const cfgObj = config.init;
				if (
					cfgObj.properties.some(
						(prop) =>
							prop.type === 'Property' &&
							prop.key.type === 'Identifier' &&
							prop.key.name === 'preprocess'
					)
				) {
					// Something weird is happening in this case, preprocess shouldn't exist right now
					return false;
				}
				cfgObj.properties.push({
					kind: 'init',
					method: false,
					shorthand: false,
					computed: false,

					type: 'Property',
					key: {
						type: 'Identifier',
						name: 'preprocess'
					},
					value: {
						type: 'ArrayExpression',
						elements: [
							{
								type: 'CallExpression',
								callee: {
									type: 'Identifier',
									name: importName
								},
								optional: false,
								arguments: []
							}
						]
					}
				});
				updatedPreprocess = true;

				return false;
			}
		});
		if (!updatedPreprocess)
			throw new EvidenceError('Failed to insert preprocessor to svelte configuration');
	}

	await fs.writeFile(svelteConfig, prettyPrint(svelteConfigAst).code);
};
