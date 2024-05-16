const parse5 = require('parse5');

/**
 * @param {ChildNode} node
 * @returns {string}
 */
const getTextContent = (node) => {
	let text = '';
	for (const child of node.childNodes) {
		if (child.nodeName === '#text') {
			text += child.value;
		} else if (child.childNodes) {
			text += getTextContent(child);
		}
	}
	return text;
};

/**
 * @type {import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const processMarkdownMetadata = {
	script({ content, markup, filename, attributes }) {
		if (!filename?.endsWith('+page.md')) return;
		if (attributes.context !== 'module') return;

		let firstHeading, firstParagraph;

		const document = parse5.parseFragment(markup);

		for (const node of document.childNodes) {
			if (!firstHeading && node.nodeName === 'h1') {
				const text = getTextContent(node);
				if (text.length) {
					firstHeading = text;
				}
			}

			if (!firstParagraph && node.nodeName === 'p') {
				const text = getTextContent(node);
				if (text.length) {
					firstParagraph = text;
				}
			}

			if (firstHeading && firstParagraph) {
				break;
			}
		}

		const markdownMetadata = {
			title: firstHeading ?? '',
			description: firstParagraph ?? ''
		};

		return {
			code: content + `;const markdownMetadata = ${JSON.stringify(markdownMetadata)};`
		};
	}
};

module.exports = processMarkdownMetadata;
