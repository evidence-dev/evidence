import { parse, walk } from 'svelte/compiler';

/**
 * @returns {import("svelte/compiler").PreprocessorGroup}
 */
export function escapeInputObjects() {
	return {
		script({ content, filename, attributes }) {
			if (!filename?.endsWith('.md')) return;
			if (attributes.context) return;
			content += 'import {MarkdownEscape} from "@evidence-dev/sdk/utils"';
			return { code: content };
		},
		markup({ content, filename }) {
			/*
                Rules:
                    Detect all references to inputs.[...]
                    Filter out references that appear in queries, or appear in the script tag
					Also filter out references that appear in element attributes
                    Append '[MarkdownEscape]' to inputs that appear directly in the markdown


                Notes:
                    At time of writing, when this is ran following @evidence-dev/preprocess,
                        the query text has already been removed from the page, meaning we only
                        need to identify references in the script tag.
            */

			if (!filename?.endsWith('.md')) return;

			const ast = /** @type {import("estree").Node} */ (/** @type {unknown} */ (parse(content)));

			/** @type {Array<import("estree").ChainExpression | import("estree").MemberExpression>} */
			let expressionStack = [];
			/** @type {Array<import("estree").Identifier | import("estree").Literal>} */
			let identifiers = [];
			let escapeHatch = false;

			let output = content;
			/** @type {{position: number, text: string}[]} */
			let insertions = [];

			walk(ast, {
				enter(node) {
					// @ts-expect-error Svelte doesn't agree with estree
					if (node.type === 'Script') {
						escapeHatch = true;
					}
					if (node.type === 'CallExpression') {
						escapeHatch = true;
					}
					// @ts-expect-error Svelte doesn't agree with estree
					if (node.type === 'Attribute') {
						// console.log(node.value[0])
						// @ts-expect-error Svelte doesn't agree with estree
						if (node.value[0]?.expression?.type === 'MemberExpression') {
							// this means that we aren't dealing with string interpolation - and thus want to leave it alone
							escapeHatch = true;
						}
					}

					if (node.type === 'ChainExpression' || node.type === 'MemberExpression') {
						expressionStack.unshift(node);
					}
					if (node.type === 'Identifier' || node.type === 'Literal') {
						identifiers.push(node);
					}
				},
				leave(node) {
					if (node.type === 'ChainExpression' || node.type === 'MemberExpression') {
						expressionStack.shift();
					}
					if (expressionStack.length === 0) {
						if (escapeHatch) {
							escapeHatch = false;
							identifiers.length = 0;
							return;
						}
						if (
							!identifiers.length ||
							!('name' in identifiers[0]) ||
							identifiers[0].name !== 'inputs' ||
							identifiers.length === 1
						) {
							identifiers.length = 0;
							return;
						}

						let targetLocation = Math.max(
							...identifiers.map((id) => {
								if ('end' in id) {
									// @ts-expect-error Types are screwy here
									return id.end + 1;
								}
								return -1;
							})
						);

						insertions.push({ position: targetLocation, text: '[MarkdownEscape]' });

						identifiers.length = 0;
					}
				}
			});

			// Sort insertions in reverse order of position
			insertions.sort((a, b) => b.position - a.position);

			// Apply insertions
			for (const insertion of insertions) {
				output =
					output.slice(0, insertion.position - 1) +
					insertion.text +
					output.slice(insertion.position - 1);
			}

			return { code: output };
		}
	};
}
