import { JSDOM } from 'jsdom';
import chalk from 'chalk';
import * as mdx from 'mdsvex';

/**
 *
 * @param {string} filename
 * @returns {Exclude<mdx.MdsvexCompileOptions["highlight"], false | undefined>["highlighter"]}
 */
const highlighter =
	(filename) =>
	/**
	 *
	 * @param {string} code
	 * @param {string} [lang]
	 * @param {string} [meta]
	 * @returns {string}
	 */

	(code, lang, meta) => {
		const fragment = JSDOM.fragment('<pre><code></code></pre>');
		const preEl = fragment.querySelector('pre');
		const codeEl = fragment.querySelector('code');
		if (!preEl) throw new Error('<pre/> Element not found (internal error)');
		if (!codeEl) throw new Error('<code/> Element not found (internal error)');

		if (lang) {
			codeEl.classList.add(`language-${lang}`);
		}
		if (lang !== 'sql' || (lang === 'sql' && !meta)) {
			if (lang) codeEl.setAttribute('lang', lang);
			if (meta) codeEl.setAttribute('data-meta', meta);
		} else {
			if (!meta) {
				// TODO: This never actually fires because the behavior for bare sql needs to be defined
				console.log(chalk.red.bold(`[!] Query with no name detected in ${filename}!`));
				console.log(chalk.red(`\t${code.split('\n')[0]}`));
			}
			codeEl.setAttribute('lang', lang);
			if (meta) codeEl.setAttribute('evidence-query-name', meta);
		}
		codeEl.textContent = code;
		return preEl.outerHTML;
	};

/**
 * @param {string} content
 * @param {string} filename
 * @returns {Promise<string>}
 */
export const processMarkdown = async (content, filename) => {
	const mdxResult = await mdx.compile(content, {
		smartypants: false,
		highlight: { highlighter: highlighter(filename) }
	});

	if (!mdxResult) throw new Error(`${filename} | Failed to convert markdown to html`);
	return mdxResult.code.trim();
};
