// @ts-check

/** @typedef {import('vite').ErrorPayload['err']} ViteError */

/** @param {ViteError} err */
export function handleClosingTagErrors(err) {
	if (err.message.includes('attempted to close an element that was not open')) {
		if (
			err.message.includes('</li>') ||
			err.message.includes('</ol>') ||
			err.message.includes('</ul>')
		) {
			return 'Component was left open. Ensure all components are closed, either with a self-closing tag ending in `/>` or with a closing tag like `</DataTable>`';
		} else if (err.message.includes('</p>')) {
			if (err.frame?.includes('>/></p>')) {
				return 'Blank line found before end of self-closing component tag. Blank line should be removed.';
			} else if (err.frame?.includes('{/each}</p>') || err.frame?.includes('{/each}<')) {
				return '{#each} block requires an empty line before the closing {/each} tag';
			} else if (err.frame?.includes('{/if}</p>') || err.frame?.includes('{/if}<')) {
				return '{#if} block requires an empty line before the closing {/if} tag';
			} else {
				return 'Component was left open. Ensure all components are closed, either with a self-closing tag ending in `/>` or with a closing tag like `</DataTable>`';
			}
		} else {
			return err.message.match(/<\/[^>]+> attempted to close an element that was not open/);
		}
	}
	return null; // No match found
}

/** @param {ViteError} err */
export function handleUnexpectedBlockClosingTagErrors(err) {
	if (err.message.includes('Unexpected block closing tag')) {
		if (err.frame?.includes('{/each}<')) {
			// previously '{/each}</li>'
			return '{#each} block requires an empty line before the closing {/each} tag';
		} else if (err.frame?.includes('{/if}<')) {
			// previously '{/if}</li>'
			return '{#if} block requires an empty line before the closing {/if} tag';
		} else {
			return 'Component was left open. Ensure all components are closed, either with a self-closing tag ending in `/>` or with a closing tag like `</DataTable>`';
		}
	}
	return null; // No match found
}

/** @param {ViteError} err */
export function handleOpenTagErrors(err) {
	if (err.message.includes('Block was left open')) {
		if (err.frame?.includes('{#each')) {
			return 'Missing closing {/each} tag';
		} else if (err.frame?.includes('{#if')) {
			return 'Missing closing {/if} tag';
		} else {
			return 'Component tag was left open. Ensure that all components are closed';
		}
	}
	return null; // No match found
}

/** @param {ViteError} err */
export function handleExpectedCharacterErrors(err) {
	if (err.message.includes('Expected }')) {
		if (err.frame?.includes('{#')) {
			return 'Component was left open. Ensure all components are closed, either with a self-closing tag ending in `/>` or with a closing tag like `</DataTable>`';
		} else if (err.frame?.includes('echartsOptions')) {
			return 'echartsOptions should be passed using 2 sets of curly braces like so: `echartsOptions={{ ... }}`';
		} else if (err.frame?.includes('{each')) {
			return 'Missing opening {#each} tag';
		} else {
			return 'Expected } . Ensure that any curly braces are closed (e.g., data={my_data})';
		}
	} else if (err.message.includes('Expected >')) {
		if (err.frame?.includes('>/></p>')) {
			return 'Blank line found before end of self-closing tag. Blank line should be removed.';
		} else {
			return 'Component was left open. Ensure all components are closed, either with a self-closing tag ending in `/>` or with a closing tag like `</DataTable>`';
		}
	}
	return null; // No match found
}

/** @param {ViteError} err */
export function handlePropErrors(err) {
	if (err.message.includes('Expected value for the attribute')) {
		return 'Found empty prop in component. Ensure all supplied props are filled in.';
	} else if (err.message.includes('Expected to close the attribute value with }')) {
		return 'Found prop with open curly brace. Ensure that all curly braces are closed (e.g., data={my_data})';
	} else if (err.message.includes('Attributes need to be unique')) {
		return 'Found duplicate props. Props must be unique. If this is unexpected, check that all of your components are successfully closed either with a self-closing tag ending in `/>` or with a closing tag like `</DataTable>`';
	}
	return null; // No match found
}

/** @param {ViteError} err */
export function handleUnexpectedEnd(err) {
	if (err.message.includes('Unexpected end of input')) {
		return 'Component was left open. Ensure all components are closed, either with a self-closing tag ending in `/>` or with a closing tag like `</DataTable>`';
	}
	return null; // No match found
}

/** @param {ViteError} err */
export function handleUnexpectedTokens(err) {
	if (err.message.includes('Unexpected token')) {
		if (err.frame?.includes('{if')) {
			return 'Unexpected {if - did you mean {#if or {/if ?';
		} else if (err.frame?.includes('{}')) {
			return 'Found empty curly braces {} - ensure all curly braces contain code';
		} else {
			console.log(`'${err.frame}'`);
			const word = RESERVED_WORDS.find((word) => err.frame?.includes(`queryID = "${word}"`));
			console.log({ word });
			const queryNameUsesReservedWord = Boolean(word);
			if (queryNameUsesReservedWord) {
				return `"${word}" cannot be used as a query name, as it is a reserved keyword. Please choose another name for your query.`;
			}
		}
	} else if (err.message.includes('Expected if, each or await')) {
		return 'Expected if or each after {#';
	}
	return null; // No match found
}

/** @param {ViteError} err */
export function handleExpectedWhitespace(err) {
	if (err.message.includes('Expected whitespace')) {
		if (err.frame?.includes('{#each}')) {
			return '{#each} block requires a query result and an alias: {#each my_query as row}';
		} else if (err.frame?.includes('{#if}')) {
			return '{#if} block requires a condition: {#if my_query.length > 10}';
		}
	}
	return null; // No match found
}

/** From https://www.w3schools.com/js/js_reserved.asp */
const RESERVED_WORDS = [
	'arguments',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'eval',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'implements',
	'import',
	'in',
	'instanceof',
	'interface',
	'let',
	'new',
	'null',
	'package',
	'private',
	'protected',
	'public',
	'return',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield'
];
