import * as jsdom from 'jsdom';

/** @type {import("svelte/types/compiler/preprocess").PreprocessorGroup} */
export const obfuscateCode = {
	markup: ({ content }) => {
		const dom = new jsdom.JSDOM(content, { contentType: 'text/html' });
		const codeElements = dom.window.document.querySelectorAll('code');
		let r = content;
		codeElements.forEach((el) => {
			const originalContent = el.innerHTML;
			el.innerHTML = `{@html atob(\`${btoa(el.innerHTML.trim() ?? '')}\`)}`;
			r = r.replace(originalContent, el.innerHTML);
		});

		return { code: r.trim() };
	}
};
