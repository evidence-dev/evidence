import { applyTitleTagReplacement } from './formatting';

export default function formatTitle(column, columnFormat) {
	let result = applyTitleTagReplacement(column, columnFormat);
	// Allow some acronyms to remain fully capitalized in titles:
	let acronyms = ['id', 'gdp'];
	// Allow some joining words to remain fully lowercased in title:
	let lowercase = ['of', 'the', 'and', 'in', 'on'];
	// Set name to proper casing:
	function toTitleCase(str) {
		return str.replace(/\S*/g, function (txt) {
			if (!acronyms.includes(txt) && !lowercase.includes(txt)) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			} else if (acronyms.includes(txt)) {
				return txt.toUpperCase();
			} else {
				return txt.toLowerCase();
			}
		});
	}
	// Remove all underscores before passing to title case function:
	result = toTitleCase(result.replace(/_/g, ' '));
	return result;
}
