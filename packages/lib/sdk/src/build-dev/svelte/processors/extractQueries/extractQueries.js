import { setFileMetadata } from '../../metadatas.js';
import * as jsdom from 'jsdom';

/** @type {import("svelte/types/compiler/preprocess").PreprocessorGroup} */
export const extractQueries = {
	markup: ({ filename, content }) => {
		if (!filename) return;
		const dom = new jsdom.JSDOM(content, { contentType: 'text/html' });
		const codeElements = dom.window.document.querySelectorAll('code');
		/** @type {import('../../metadatas.js').FileMetadata} */
		const data = { queries: {} };
		// TODO: Is this actually needed?
		// const body = dom.window.document.documentElement.querySelector('body');
		// if (!body) throw new Error('Body is undefined');
		// dom.window.document.head.querySelectorAll('script').forEach((el) => body.prepend(el));
		let r = content;

		codeElements.forEach((el) => {
			if (el.getAttribute('evidence-query-name') && !el.getAttribute('lang'))
				el.setAttribute('lang', 'sql');
			const lang =
				el.attributes.getNamedItem('lang')?.value ??
				el.attributes.getNamedItem('data-lang')?.value ??
				Array.from(el.classList.values())
					.find((cn) => cn.startsWith('language-'))
					?.split('language-')[1];

			const content = el.textContent ?? '';
			const queryName = el.attributes.getNamedItem('evidence-query-name')?.value;
			if (queryName) {
				switch (lang) {
					case 'sql':
						data.queries[queryName] = content.trim();
						break;
					case 'malloy':
						// TODO: Convert malloy to sql
						break;
					case 'prql':
						// TODO: Convert prql to sql
						break;
				}
			}
		});

		setFileMetadata(filename, data);

		return { code: r.trim() };
	}
};
