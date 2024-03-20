import { findFile } from 'pkg-types';
import { parse, prettyPrint, visit } from 'recast';
import fs from 'fs/promises';
import { EvidenceError } from '../../../lib/EvidenceError.js';

export const updateViteConfig = async () => {
	const viteConfig = await findFile('vite.config.ts')
		.catch(() => findFile('vite.config.js'))
		.catch(() => {
			throw new EvidenceError(
				'Could not find a valid vite configuration file (vite.config.js, vite.config.ts)'
			);
		});
	const viteConfigContent = await fs.readFile(viteConfig, 'utf-8');
	/** @type {{program: import("estree").Program}} */
	const { program: viteConfigAst } = await parse(viteConfigContent);

	let foundImport = false;
	let importName = 'evidenceVite';

	visit(viteConfigAst, {
		visitImportDeclaration({ node }) {
			if (node.source.value !== '@evidence-dev/sdk')
				// TODO: Update this package title
				return false;

			const importValue = node.specifiers?.find(
				(spec) => spec.type === 'ImportSpecifier' && spec.imported.name === 'evidenceVite'
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
				throw new EvidenceError(
					'Failed to add needed imports to vite configuration',
					'You may need to install Evidence manually'
				); // TODO: Docs page
			}
			return false;
		},
		visitCallExpression({ node }) {
			// TODO: Is there any sense in tracking down a plugin that is declared outside the defineConfig?
			//       I think not, if they are at that point they can set it up themselves
			if (node.callee.type !== 'Identifier') return false;
			if (node.callee.name !== 'defineConfig') return false;

			/** @type {import("estree").ObjectExpression} */
			let opts;
			if (node.arguments.length === 0)
				node.arguments.push({
					type: 'ObjectExpression',
					properties: []
				});
			if (node.arguments[0].type !== 'ObjectExpression') {
				throw new EvidenceError(
					'Cannot update vite.config.js, unexpected argument found in defineConfig',
					'You may need to install Evidence manually'
				); // TODO: Docs page
			}
			opts = /** @type {import("estree").ObjectExpression} */ (node.arguments[0]);
			if (
				!opts.properties.some(
					(prop) =>
						prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name == 'plugins'
				)
			) {
				// Add plugins key
				opts.properties.push({
					type: 'Property',
					kind: 'init',
					method: false,
					shorthand: false,
					computed: false,
					key: {
						type: 'Identifier',
						name: 'plugins'
					},
					value: {
						type: 'ArrayExpression',
						elements: []
					}
				});
			}

			const pluginArray = /** @type {import("estree").ArrayExpression} */ (
				/** @type {import("estree").Property} */ (
					opts.properties.find(
						(prop) =>
							prop.type === 'Property' &&
							prop.key.type === 'Identifier' &&
							prop.key.name === 'plugins' &&
							prop.value.type === 'ArrayExpression'
					)
				)?.value
			);

			const hasCall = pluginArray.elements.some(
				(el) =>
					el &&
					el.type === 'CallExpression' &&
					el.callee.type === 'Identifier' &&
					el.callee.name === importName
			);
			if (!hasCall) {
				pluginArray.elements.push({
					type: 'CallExpression',
					callee: {
						type: 'Identifier',
						name: importName
					},
					arguments: [],
					optional: false
				});
			}

			return false;
		}
	});

	if (!foundImport) {
		viteConfigAst.body = [
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
			...viteConfigAst.body
		];
	}

	await fs.writeFile(viteConfig, prettyPrint(viteConfigAst).code);
};
