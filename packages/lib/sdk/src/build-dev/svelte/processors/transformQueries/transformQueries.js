import * as jsdom from 'jsdom';
import { checkImport } from '../../../../lib/check-import.js';

/**
 * @type {Record<string, boolean>}
 */
const fileHasQueries = {};

/** @type {import("svelte/types/compiler/preprocess").PreprocessorGroup} */
export const transformQueries = {
	script: ({ filename, content, attributes }) => {
		if (attributes.context) return;
		if (!filename) return;
		if (!fileHasQueries[filename]) return;
		if (checkImport('QuerySSR', '$evidence/QuerySSR.svelte', content)) return { code: content };
		else {
			return { code: `import QuerySSR from "$evidence/QuerySSR.svelte";\n` + content };
		}
	},
	markup: ({ filename, content }) => {
		if (!filename) return;
		const dom = new jsdom.JSDOM(content, { contentType: 'text/html' });
		const codeElements = dom.window.document.querySelectorAll('code[evidence-query-name]');
		if (codeElements.length) {
			fileHasQueries[filename] = true;
		}
		let r = content;
		for (const el of codeElements) {
			let target = el;
			if (el.parentElement?.tagName.toLowerCase() === 'pre') {
				target = el.parentElement;
			}
			const originalHtml = target.outerHTML;

			target.classList.add('text-xs');
			target.classList.add('leading-tight');
			target.classList.add('bg-base-300');
			target.classList.add('p-2');
			target.classList.add('w-fit');
			target.classList.add('min-w-[60ch]');
			el.textContent = `{__evidence_query_text_${el.getAttribute('evidence-query-name')}}`;

			// TODO: Figure this out
			const replaceTarget = originalHtml.replaceAll('&lt;', '<').replaceAll('&gt;', '>');

			r = r.replace(replaceTarget, '');
			r =
				r +
				`\n<svelte:head> <meta evidence-query-presence={btoa(__evidence_query_text_${el.getAttribute(
					'evidence-query-name'
				)})} evidence-query-content={__evidence_query_text_${el.getAttribute(
					'evidence-query-name'
				)}}> </svelte:head>`;
		}

		return { code: r };
	}
};
