export const InputRefRegex = /inputs\.(?:\.|[\w]|\s+\.|\s+\?\.)+/g;

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

			const inputRefs = content.matchAll(InputRefRegex);

			const scriptStarts = Array.from(content.matchAll(/<script/g)) ?? [];
			const scriptEnds = Array.from(content.matchAll(/<\/script/g)) ?? [];

			/** @type {[number, number][]} */
			const scriptRanges = [];
			for (let i = 0; i < scriptStarts.length; i++) {
				if (!scriptEnds[i]) {
					console.debug('Found script tag without closing tag', i);
					continue;
				}
				scriptRanges.push([scriptStarts[i].index, scriptEnds[i].index]);
			}

			let output = content;
			let offset = 0;
			const appendString = '[MarkdownEscape]';
			for (const match of inputRefs ?? []) {
				const inScript = scriptRanges.find(
					([start, end]) => start <= match.index && match.index <= end
				);
				if (inScript) {
					console.debug(
						'Identified input reference in script tag',
						match[0],
						match.index,
						inScript
					);
					continue;
				}
				console.debug('Identified input reference in markdown', match[0], match.index);

				const before = output.slice(0, match.index + offset);
				const after = output.slice(match.index + offset + match[0].length);
				output = before + `${match[0] + appendString}` + after;
				offset += appendString.length;
			}
			return { code: output };
		}
	};
}
