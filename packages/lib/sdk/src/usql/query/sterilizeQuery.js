const unescapedComment = /--([^']|'.*')+$/;
const inlinedMultilineComments = /(\/\*.*\*\/)/g;
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
	let inMultilineComment = false;
	// iterate in reverse order because we only want to find the last failing line
	for (let i = lines.length; i > 0; i--) {
		// grab the line
		let line = lines[i - 1];
		// keep track of any content we remove from the end of the line that we want to add back
		let append = '';

		// detect if there are any inlined multiline comments
		const multilineMatches = Array.from(line.matchAll(inlinedMultilineComments));
		for (const multilineMatch of multilineMatches) {
			// remove all inline multiline comments (these are re-added at the end)
			const before = line.slice(0, multilineMatch.index);
			const after = line.slice(multilineMatch.index + multilineMatch[0].length);
			line = `${before}${after}`;
		}

		// if we are in a multiline comment, we don't want to do anything
		if (inMultilineComment) {
			// TODO: Does duckdb handle nested comments? This does not
			if (line.includes('/*')) {
				// we are at the start
				inMultilineComment = false; // we are no longer in a multiline comment
				const parts = line.split('/*');
				line = parts.slice(0, -1).join('/*'); // remove the last part of the comment
				// (assume that "/* /* xx" is only "/* xx" as the comment)
				append += '/*' + parts.slice(-1); // ensure we re-add the comment at the end
			}
		}
		if (line.trim().endsWith('*/')) {
			// we are at the end of a multiline comment
			inMultilineComment = true;
			continue;
		}

		// Handle single line comments

		const match = unescapedComment.exec(line);
		// If we have an unescaped comment
		if (match) {
			// get the content before the comment, check if it ends with a semicolon
			const before = line.slice(0, match.index);
			const trimmed = before.trimEnd();
			if (trimmed.endsWith(';')) {
				// reconstruct the line without the ;
				const after = line.slice(match.index);
				const mid = before.slice(trimmed.length, before.length);
				line = `${before.slice(0, -1 + -1 * (before.length - trimmed.length))}${mid}${after}`;
			}
		} else {
			// no comments, we can just remove trailing semicolons
			const trimmed = line.trimEnd();
			if (trimmed.endsWith(';')) {
				const lastIdx = line.lastIndexOf(';');
				line = line.slice(0, lastIdx) + line.slice(lastIdx + 1);
			}
		}

		// re-add multiline comments that may have been removed at the beginning
		for (const multilineMatch of multilineMatches) {
			const before = line.slice(0, multilineMatch.index);
			const after = line.slice(multilineMatch.index);
			line = `${before}${multilineMatch[0]}${after}`;
		}
		// if we have modified the line, update and escape the loop ( we don't handle inline statements - that's on the user )
		if (line !== lines[i - 1]) {
			lines[i - 1] = line + append;
			break;
		}
	}

	lines.push(''); // add a blank newline at the end

	return lines.join('\n');
};
