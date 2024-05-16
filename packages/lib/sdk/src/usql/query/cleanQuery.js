/**
 * Removes comments and semicolons from a query
 * @param {string} query
 * @returns {string}
 */
export const cleanQuery = (query) => {
	let cleanedQuery = '';
	let insideString = false;
	let quoteChar = null;

	for (let i = 0; i < query.length; i++) {
		const char = query[i];

		// Check if a string is being opened or closed
		if (char === "'" || char === '"') {
			if (!insideString) {
				insideString = true;
				quoteChar = char;
			} else if (char === quoteChar) {
				insideString = false;
				quoteChar = null;
			}
			cleanedQuery += char;
		} else if (insideString) {
			// If inside a string, keep adding characters
			cleanedQuery += char;
		} else if (char === '-' && i < query.length - 1 && query[i + 1] === '-') {
			// Skip single-line comments
			while (i < query.length && query[i] !== '\n') {
				i++;
			}
		} else if (char === '/' && i < query.length - 1 && query[i + 1] === '*') {
			// Skip multi-line comments
			i += 3;
			while (i < query.length && !(query[i - 1] === '*' && query[i] === '/')) {
				i++;
			}
		} else if (char !== ';') {
			cleanedQuery += char;
		}
	}

	cleanedQuery = cleanedQuery.trim();

	return cleanedQuery;
};
