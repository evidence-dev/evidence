import * as jsdom from 'jsdom';
import hljs from 'highlight.js';

/** @type {import("svelte/types/compiler/preprocess").PreprocessorGroup} */
export const highlight = {
	markup: ({ content }) => {
		const dom = new jsdom.JSDOM(content, { contentType: 'text/html' });
		const codeElements = dom.window.document.querySelectorAll('code');
		let r = content;

		codeElements.forEach((el) => {
			const originalContent = el.outerHTML;
			if (el.getAttribute('evidence-query-name') && !el.getAttribute('lang'))
				el.setAttribute('lang', 'sql');

			const lang =
				el.attributes.getNamedItem('lang')?.value ??
				el.attributes.getNamedItem('data-lang')?.value ??
				Array.from(el.classList.values())
					.find((cn) => cn.startsWith('language-'))
					?.split('language-')[1];

			if (!lang) return;
			const elContent = el.textContent ?? '';

			const highlighted =
				lang && hljs.listLanguages().includes(lang.toLowerCase())
					? hljs.highlight(elContent, { language: lang.toLowerCase() })
					: elContent;
			if (lang) el.classList.add(`language-${lang}`);
			if (['javascript', 'js'].includes(lang)) el.removeAttribute('lang');

			if (typeof highlighted === 'string') el.innerHTML = highlighted;
			else el.innerHTML = highlighted.value;

			const doc = el.ownerDocument;
			let target = el;

			if (el.parentElement && el.parentElement.tagName.toLowerCase() !== 'pre') {
				const pre = doc.createElement('pre');
				el.parentElement.insertBefore(pre, el);
				el.remove();
				pre.appendChild(el);
				target = pre;
			}

			r = r.replace(originalContent, target.outerHTML);
		});

		return { code: r };
	}
};
