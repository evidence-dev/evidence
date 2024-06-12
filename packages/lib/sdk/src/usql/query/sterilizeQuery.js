const unescapedComment = /--[^']+$/;
const hasSemicolon = /(.+);(\s--)?(.*)/g;
const ESCAPED_SEMICOLONS = /(?:(?<=').*;.*(?=')|(?<=--).*;.*)/g;
const ALL_SEMICOLONS = /;/g;
/**
 * This function ensures that a query can safely be sent to DuckDB
 * It adds a newline to the query if it ends in a comment, and
 * ensures that the statement does not end with a semicolon
 *
 * It is not responsible for removing semicolons in
 * subqueries or nested expressions, only the root expression
 *
 * @param {string} query
 */
export const sterilizeQuery = (query) => {
	const lines = query.split('\n');
	for (let i = lines.length; i > 0; i--) {
		const line = lines[i - 1];
		const semicolons = Array.from(line.matchAll(hasSemicolon));
		const escapedSemicolons = Array.from(line.matchAll(ESCAPED_SEMICOLONS));
		const allSemicolons = Array.from(line.matchAll(ALL_SEMICOLONS));
		// console.log({ semicolons, allSemicolons, escapedSemicolons });

		/** @type {number[]} */
		const validPositions = [];
		for (const match of escapedSemicolons) {
			const [matchText] = match;
			const { index } = match;
			const segments = matchText.split(';');
			console.log({ in: match.input, matchText, segments });
			let totalOffset = 0;
			 segments.slice(0,-1).map((s, i) => {
				validPositions.push(index + i + totalOffset);
			});
		}
		console.log(validPositions);
		console.log(escapedSemicolons.map(p => p.index + p.length));
		console.log(allSemicolons.map(p => p.index));
		console.log(semicolons.map(p => p.index));

		if (allSemicolons.length > escapedSemicolons.length) {
			lines[i - 1] = semicolons[0].slice(1).join('');
			break;
		}
	}

	if (lines.at(-1)?.match(unescapedComment)) {
		lines.push(''); // add a blank newline at the end
	}

	return lines.join('\n');
};
